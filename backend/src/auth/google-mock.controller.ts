import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class GoogleMockController {
  constructor(private readonly authService: AuthService) {}

  @Post('google-mock')
  async googleMockAuth(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const { email, password } = body;

      // 简单验证
      if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: '请输入邮箱和密码',
        });
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: '请输入有效的邮箱地址',
        });
      }

      // 模拟Google用户数据
      const mockUser = {
        id: `google-${email.split('@')[0]}`,
        email: email,
        firstName: email.split('@')[0],
        lastName: 'User',
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=4285f4&color=fff`,
      };

      // 创建或查找用户并生成token
      const result = await this.authService.findOrCreateGoogleUser(mockUser);

      return res.status(HttpStatus.OK).json({
        success: true,
        token: result.accessToken,
      });
    } catch (error) {
      console.error('Google mock auth error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: '登录失败，请重试',
      });
    }
  }
}