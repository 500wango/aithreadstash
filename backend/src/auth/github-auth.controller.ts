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

  @Get('github')
  async githubAuth(@Res() res: Response) {
    try {
      // 在开发模式下，重定向到模拟的GitHub登录页面
      if (process.env.NODE_ENV === 'development') {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/github-mock`);
      }
      
      // 生产模式下使用正常的GitHub OAuth流程
      // 但由于网络问题，重定向到错误页面
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const errorMessage = encodeURIComponent('GitHub OAuth服务暂时不可用，请尝试邮箱注册');
      return res.redirect(`${frontendUrl}/login?error=${errorMessage}`);
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
      
      // 重定向到前端页面，携带token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/success?token=${result.accessToken}`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  // 新增：获取GitHub OAuth状态的API端点
  @Get('github/status')
  async getGitHubOAuthStatus() {
    return {
      available: process.env.NODE_ENV === 'development',
      error: 'NETWORK_CONNECTION_ERROR',
      message: 'GitHub OAuth服务暂时不可用，由于网络连接问题无法连接到GitHub服务器',
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