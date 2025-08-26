import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class GoogleAuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // 重定向到Google认证页面
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.findOrCreateGoogleUser(req.user);
      
      // 重定向到前端页面，携带token
      res.redirect(`http://localhost:3000/auth/success?token=${result.accessToken}`);
    } catch (error) {
      res.redirect(`http://localhost:3000/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }
}