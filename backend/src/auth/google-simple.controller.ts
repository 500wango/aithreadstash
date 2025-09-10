import { Controller, Get, Query, Res, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { GoogleOAuthSimpleService } from './google-oauth-simple.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class GoogleSimpleController {
  private readonly logger = new Logger(GoogleSimpleController.name);
  constructor(
    private googleOAuthService: GoogleOAuthSimpleService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  async googleAuth(@Res() res: Response) {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const enabled = this.configService.get<string>('ENABLE_GOOGLE_OAUTH') === '1';
      const hasConfig = Boolean(
        this.configService.get<string>('GOOGLE_CLIENT_ID') &&
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') &&
        this.configService.get<string>('GOOGLE_CALLBACK_URL')
      );

      // 在开发模式下，如果未启用，则重定向到模拟的Google登录页面
      if (isDev && !enabled) {
        return res.redirect(`${frontendUrl}/auth/google-mock`);
      }

      // 未启用或配置不完整时给出友好提示
      if (!enabled || !hasConfig) {
        const errorMessage = encodeURIComponent('Google OAuth未开启或配置不完整，请使用邮箱登录/注册');
        return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
      }
      
      // 生产模式下使用正常的Google OAuth流程
      const authUrl = this.googleOAuthService.getAuthUrl();
      return res.redirect(authUrl);
    } catch (error) {
      // 如果无法生成授权URL，重定向到前端并显示错误
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const errorMessage = encodeURIComponent('Google OAuth服务暂时不可用，请尝试邮箱注册');
      return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
    }
  };

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

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
      return res.redirect(`${frontendUrl}/auth/success?accessToken=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(result.refreshToken)}`);
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error as any);
      
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

  // 新增：获取Google OAuth状态的API端点（根据配置动态返回）
  @Get('google/status')
  async getGoogleOAuthStatus() {
    const isDev = process.env.NODE_ENV === 'development';
    const enabled = this.configService.get<string>('ENABLE_GOOGLE_OAUTH') === '1';
    const hasConfig = Boolean(
      this.configService.get<string>('GOOGLE_CLIENT_ID') &&
      this.configService.get<string>('GOOGLE_CLIENT_SECRET') &&
      this.configService.get<string>('GOOGLE_CALLBACK_URL')
    );
    const available = (isDev && !enabled) ? false : (enabled && hasConfig);

    return {
      available,
      error: available ? undefined : 'OAUTH_DISABLED_OR_MISCONFIGURED',
      message: available
        ? 'Google OAuth可用'
        : (isDev && !enabled)
          ? '开发模式下未启用Google OAuth（ENABLE_GOOGLE_OAUTH=1 可开启，或使用邮箱注册）'
          : 'Google OAuth未开启或配置不完整，请联系管理员或使用邮箱登录/注册',
      suggestions: available ? [] : [
        '设置 ENABLE_GOOGLE_OAUTH=1',
        '配置 GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_CALLBACK_URL',
        '确保服务器可以访问 Google 域名（网络与防火墙）'
      ],
      developmentMode: isDev,
      lastChecked: new Date().toISOString()
    };
  }
}