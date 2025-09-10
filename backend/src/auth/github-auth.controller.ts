import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class GitHubAuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private isEnabled() {
    return this.configService.get<string>('ENABLE_GITHUB_OAUTH') === '1';
  }

  private hasConfig() {
    return Boolean(
      this.configService.get<string>('GITHUB_CLIENT_ID') &&
      this.configService.get<string>('GITHUB_CLIENT_SECRET') &&
      this.configService.get<string>('GITHUB_CALLBACK_URL')
    );
  }

  // New: dedicated route to start Passport GitHub flow
  @Get('github/passport')
  @UseGuards(AuthGuard('github'))
  async githubAuthPassport() {
    // Passport will handle redirecting to GitHub
  }

  @Get('github')
  async githubAuth(@Res() res: Response) {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

      const enabled = this.isEnabled();
      const hasConfig = this.hasConfig();

      // In development, if not enabled, redirect to mock page for UX
      if (isDev && (!enabled || !hasConfig)) {
        return res.redirect(`${frontendUrl}/auth/github-mock`);
      }

      // Not enabled or misconfigured -> friendly error
      if (!enabled || !hasConfig) {
        const errorMessage = encodeURIComponent('GitHub OAuth未开启或配置不完整，请使用邮箱登录/注册');
        return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
      }
      
      // Start real GitHub OAuth via Passport route
      return res.redirect(`/auth/github/passport`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const errorMessage = encodeURIComponent('GitHub OAuth登录失败');
      return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
    }
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.findOrCreateGitHubUser(req.user);
      
      // 重定向到前端页面，携带accessToken与refreshToken（用于后续静默刷新）
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/success?accessToken=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(result.refreshToken)}`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent((error as any).message || 'GitHub OAuth错误')}`);
    }
  }

  // Updated: status derived from enable flag and config presence
  @Get('github/status')
  async getGitHubOAuthStatus() {
    const isDev = process.env.NODE_ENV === 'development';
    const enabled = this.isEnabled();
    const hasConfig = this.hasConfig();
    const available = enabled && hasConfig;

    return {
      available,
      error: available ? undefined : 'OAUTH_DISABLED_OR_MISCONFIGURED',
      message: available
        ? 'GitHub OAuth可用'
        : (isDev && !enabled)
          ? '开发模式下未启用GitHub OAuth（ENABLE_GITHUB_OAUTH=1 可开启，或使用邮箱注册）'
          : 'GitHub OAuth未开启或配置不完整，请联系管理员或使用邮箱登录/注册',
      suggestions: available ? [] : [
        '设置 ENABLE_GITHUB_OAUTH=1',
        '配置 GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET/GITHUB_CALLBACK_URL'
      ],
      developmentMode: isDev,
      lastChecked: new Date().toISOString()
    };
  }
}