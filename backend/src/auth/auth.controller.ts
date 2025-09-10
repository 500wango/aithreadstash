import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request, NotFoundException, Query, BadRequestException } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './get-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { User } from '../database/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, @InjectRepository(User) private readonly usersRepo: Repository<User>) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.email, registerDto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscriptionStatus: user.subscriptionStatus,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      onTrial: user.onTrial,
      trialEndsAt: user.trialEndsAt,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(@GetUser() user: User) {
    return this.authService.refreshToken(user.id);
  }

  // 新增：基于 refreshToken 的刷新（无需携带 accessToken）
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshByToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshByRefreshToken(dto.refreshToken);
  }

  // Forgot / Reset Password
  // 限制: 每 IP 每 10 分钟最多 3 次
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  // 限制: 每 IP 每 10 分钟最多 10 次
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @Get('reset-password/verify')
  async verifyResetToken(@Query('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  // 限制: 每 IP 每 10 分钟最多 10 次
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPasswordWithToken(dto.token, dto.newPassword);
  }

  // 开始试用：7 天
  @Post('start-trial')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async startTrial(@GetUser() user: User) {
    // 已是 Pro 不允许开试用
    if (user.subscriptionStatus === 'pro') {
      throw new BadRequestException('Already a Pro subscriber');
    }
    // 已在试用中
    if (user.onTrial && user.trialEndsAt && user.trialEndsAt.getTime() > Date.now()) {
      const remainingMs = user.trialEndsAt.getTime() - Date.now();
      return {
        message: 'Trial already active',
        onTrial: true,
        trialEndsAt: user.trialEndsAt,
        remainingSeconds: Math.floor(remainingMs / 1000),
      };
    }
    // 启动 7 天试用
    user.onTrial = true;
    user.trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.usersRepo.save(user);
    return {
      message: 'Trial started',
      onTrial: true,
      trialEndsAt: user.trialEndsAt,
    };
  }
}