import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../database/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async register(email: string, password: string): Promise<{ accessToken: string }> {
    // 检查用户是否已存在
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      subscriptionStatus: 'free',
    });
    
    const savedUser = await this.usersRepository.save(user);
    
    return this.generateTokens(savedUser);
  }

  async findOrCreateGoogleUser(googleUser: any): Promise<{ accessToken: string }> {
    const { email, firstName, lastName } = googleUser;
    
    // 检查用户是否已存在
    let user = await this.usersRepository.findOne({ 
      where: { 
        email,
        googleId: googleUser.id 
      } 
    });
    
    if (!user) {
      // 检查邮箱是否已被其他方式注册
      const existingUser = await this.usersRepository.findOne({ where: { email } });
      if (existingUser) {
        // 如果邮箱已存在，更新Google ID
        existingUser.googleId = googleUser.id;
        user = await this.usersRepository.save(existingUser);
      } else {
        // 创建新用户
        user = this.usersRepository.create({
          email,
          googleId: googleUser.id,
          firstName,
          lastName,
          subscriptionStatus: 'free',
          password: '', // 空密码，使用Google登录
        });
        user = await this.usersRepository.save(user);
      }
    }
    
    return this.generateTokens(user);
  }

  async findOrCreateGitHubUser(githubUser: any): Promise<{ accessToken: string }> {
    const { email, username } = githubUser;
    
    // 检查用户是否已存在
    let user = await this.usersRepository.findOne({ 
      where: { 
        email,
        githubId: githubUser.id 
      } 
    });
    
    if (!user) {
      // 检查邮箱是否已被其他方式注册
      const existingUser = await this.usersRepository.findOne({ where: { email } });
      if (existingUser) {
        // 如果邮箱已存在，更新GitHub ID
        existingUser.githubId = githubUser.id;
        user = await this.usersRepository.save(existingUser);
      } else {
        // 创建新用户
        user = this.usersRepository.create({
          email,
          githubId: githubUser.id,
          firstName: username,
          subscriptionStatus: 'free',
          password: '', // 空密码，使用GitHub登录
        });
        user = await this.usersRepository.save(user);
      }
    }
    
    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return this.generateTokens(user);
  }

  private generateTokens(user: User): { accessToken: string } {
    const payload = { 
      sub: user.id, 
      email: user.email,
      subscriptionStatus: user.subscriptionStatus 
    };
    
    const token = this.jwtService.sign(payload);
    console.log('Generated token:', token);
    
    return {
      accessToken: token,
    };
  }

  async validateUser(payload: any): Promise<User> {
    return this.usersRepository.findOne({ where: { id: payload.sub } });
  }
}