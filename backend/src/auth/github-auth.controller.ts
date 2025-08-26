import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class GitHubAuthController {
  constructor(private authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // 重定向到GitHub认证页面
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.findOrCreateGitHubUser(req.user);
      
      // 重定向到前端页面，携带token
      res.redirect(`http://localhost:3000/auth/success?token=${result.accessToken}`);
    } catch (error) {
      res.redirect(`http://localhost:3000/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }
}