import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from '../database/user.entity'
import * as crypto from 'crypto'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 检查用户是否已存在
    const existingUser = await this.usersRepository.findOne({ where: { email } })
    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      subscriptionStatus: 'free',
    })

    const savedUser = await this.usersRepository.save(user)

    return this.generateTokens(savedUser)
  }

  async findOrCreateGoogleUser(googleUser: any): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, firstName, lastName } = googleUser

    // 检查用户是否已存在
    let user = await this.usersRepository.findOne({
      where: {
        email,
        googleId: googleUser.id,
      },
    })

    if (!user) {
      // 检查邮箱是否已被其他方式注册
      const existingUser = await this.usersRepository.findOne({ where: { email } })
      if (existingUser) {
        // 如果邮箱已存在，更新Google ID
        existingUser.googleId = googleUser.id
        user = await this.usersRepository.save(existingUser)
      } else {
        // 创建新用户（不显式设置 role，交由实体默认值处理）
        user = this.usersRepository.create({
          email,
          googleId: googleUser.id,
          firstName,
          lastName,
          subscriptionStatus: 'free',
          password: '', // 空密码，使用Google登录
        })
        user = await this.usersRepository.save(user)
      }
    }

    return this.generateTokens(user)
  }

  async findOrCreateGitHubUser(githubUser: any): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, username } = githubUser

    // 检查用户是否已存在
    let user = await this.usersRepository.findOne({
      where: {
        email,
        githubId: githubUser.id,
      },
    })

    if (!user) {
      // 检查邮箱是否已被其他方式注册
      const existingUser = await this.usersRepository.findOne({ where: { email } })
      if (existingUser) {
        // 如果邮箱已存在，更新GitHub ID
        existingUser.githubId = githubUser.id
        user = await this.usersRepository.save(existingUser)
      } else {
        // 创建新用户（不显式设置 role，交由实体默认值处理）
        user = this.usersRepository.create({
          email,
          githubId: githubUser.id,
          firstName: username,
          subscriptionStatus: 'free',
          password: '', // 空密码，使用GitHub登录
        })
        user = await this.usersRepository.save(user)
      }
    }

    return this.generateTokens(user)
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersRepository.findOne({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return this.generateTokens(user)
  }

  // 新增：根据 JWT 载荷中的 sub（用户 ID）查询用户
  async validateUser(payload: { sub: number }): Promise<User | null> {
    if (!payload || typeof payload.sub !== 'number') return null
    const user = await this.usersRepository.findOne({ where: { id: payload.sub } })
    return user ?? null
  }

  // 新增：基于用户 ID 刷新访问令牌/刷新令牌
  async refreshToken(userId: number): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('User not found')
    }
    return this.generateTokens(user)
  }

  // 新增：使用 refreshToken 刷新令牌（无须携带 accessToken）
  async refreshByRefreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: number }>(refreshToken)
      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid refresh token')
      }
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } })
      if (!user) {
        throw new UnauthorizedException('User not found')
      }
      return this.generateTokens(user)
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      sub: user.id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
    }

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' })
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' })

    return {
      accessToken,
      refreshToken,
    }
  }

  // Helper: build reset link (prefer FRONTEND_URL)
  private buildResetLink(token: string): string {
    const frontendUrl = this.config.get<string>('FRONTEND_URL')
    const apiUrl = this.config.get<string>('API_URL') || 'http://localhost:3007'
    if (frontendUrl) {
      return `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
    }
    return `${apiUrl.replace(/\/$/, '')}/auth/reset-password/verify?token=${encodeURIComponent(token)}`
  }

  // Helper: attempt to send reset email if SMTP configured
  private async trySendResetEmail(to: string, token: string): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST')
    const port = Number(this.config.get<string>('SMTP_PORT') || '587')
    const secure = String(this.config.get<string>('SMTP_SECURE') || 'false').toLowerCase() === 'true'
    const user = this.config.get<string>('SMTP_USER')
    const pass = this.config.get<string>('SMTP_PASS')
    const from = this.config.get<string>('SMTP_FROM') || 'no-reply@aithreadstash.local'

    if (!host || !user || !pass) return

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    })

    const resetLink = this.buildResetLink(token)
    const appName = this.config.get<string>('APP_NAME') || 'AI ThreadStash'

    const html = `
      <p>We received a request to reset your ${appName} password.</p>
      <p><a href="${resetLink}" target="_blank" rel="noopener">Click here to reset your password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `

    await transporter.sendMail({
      from,
      to,
      subject: `${appName} Password Reset`,
      text: `Reset your password using this link (valid for 1 hour): ${resetLink}`,
      html,
    })
  }

  // Request a password reset token (always respond success to avoid account enumeration)
  async requestPasswordReset(email: string): Promise<{ message: string; token?: string; resetUrl?: string }> {
    const user = await this.usersRepository.findOne({ where: { email } })

    // Generate token and store hashed version only if user exists
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      user.resetPasswordTokenHash = tokenHash
      // expire in 1 hour
      user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
      await this.usersRepository.save(user)

      // Try to send email if SMTP configured
      try {
        await this.trySendResetEmail(email, token)
      } catch (e) {
        // Do not leak details to client. Intentionally ignore here, optionally log in real logger.
      }

      // In development, return token and a convenience URL
      if (process.env.NODE_ENV !== 'production') {
        const resetUrl = this.buildResetLink(token)
        return { message: 'If that account exists, a reset link has been generated.', token, resetUrl }
      }
    }

    return { message: 'If that account exists, a reset link has been sent.' }
  }

  // Verify reset token validity (without revealing whether the email exists)
  async verifyResetToken(token: string): Promise<{ valid: boolean }> {
    if (!token) return { valid: false }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const now = new Date()
    const user = await this.usersRepository.findOne({ where: { resetPasswordTokenHash: tokenHash } })
    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < now) {
      return { valid: false }
    }
    return { valid: true }
  }

  // Reset password using a token
  async resetPasswordWithToken(token: string, newPassword: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) {
      throw new BadRequestException('Invalid or expired reset token')
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const now = new Date()
    const user = await this.usersRepository.findOne({ where: { resetPasswordTokenHash: tokenHash } })
    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < now) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    user.password = hashedPassword
    user.resetPasswordTokenHash = null
    user.resetPasswordExpiresAt = null
    await this.usersRepository.save(user)

    // Optionally sign-in the user after reset
    return this.generateTokens(user)
  }
}