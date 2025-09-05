import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { GoogleOAuthSimpleService } from './google-oauth-simple.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class GoogleSimpleController {
  constructor(
    private googleOAuthService: GoogleOAuthSimpleService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  async googleAuth(@Res() res: Response) {
    try {
      // 在开发模式下，重定向到模拟的Google登录页面
      if (process.env.NODE_ENV === 'development') {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/google-mock`);
      }
      
      // 生产模式下使用正常的Google OAuth流程
      const authUrl = this.googleOAuthService.getAuthUrl();
      return res.redirect(authUrl);
    } catch (error) {
      // 如果无法生成授权URL，重定向到前端并显示错误
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const errorMessage = encodeURIComponent('Google OAuth服务暂时不可用，请尝试邮箱注册');
      return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
    }
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // 如果Google返回错误
    if (error) {
      const errorMessage = encodeURIComponent(`Google OAuth错误: ${error}`);
      return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
    }

    // 如果没有授权码
    if (!code) {
      const errorMessage = encodeURIComponent('未收到Google授权码');
      return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
    }

    try {
      // 尝试处理回调
      const result = await this.googleOAuthService.handleCallback(code);
      
      // 如果成功，重定向到前端携带 token（与 GitHub/Passport 风格一致）
      return res.redirect(`${frontendUrl}/auth/success?token=${result.accessToken}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      
      // 提供详细的错误信息
      let errorMessage = 'Google OAuth登录失败';
      
      if (error instanceof HttpException) {
        const errorResponse = error.getResponse() as any;
        if (errorResponse.details) {
          errorMessage = errorResponse.details;
        } else if (errorResponse.message) {
          errorMessage = errorResponse.message;
        }
      }
      
      const encodedError = encodeURIComponent(errorMessage);
      return res.redirect(`${frontendUrl}/login?error=${encodedError}`);
    }
  }

  // 新增：获取Google OAuth状态的API端点
  @Get('google/status')
  async getGoogleOAuthStatus() {
    return {
      available: process.env.NODE_ENV === 'development',
      error: 'NETWORK_CONNECTION_ERROR',
      message: 'Google OAuth服务暂时不可用，由于网络连接问题无法连接到Google服务器',
      suggestions: [
        '检查网络连接',
        '检查防火墙设置',
        '尝试使用VPN',
        '使用邮箱注册作为替代方案'
      ],
      developmentMode: process.env.NODE_ENV === 'development',
      lastChecked: new Date().toISOString()
    };
  }
}