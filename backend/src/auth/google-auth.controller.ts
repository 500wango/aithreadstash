import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class GoogleAuthController {
  constructor(private authService: AuthService, private configService: ConfigService) {}

  // Use distinct path to avoid collision with GoogleSimpleController in development
  @Get('google-passport')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirect to Google authentication page via Passport strategy
  }

  @Get('google-passport/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.findOrCreateGoogleUser(req.user);
      
      // Redirect to frontend with token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
-     res.redirect(`${frontendUrl}/auth/success?token=${result.accessToken}`);
+     res.redirect(`${frontendUrl}/auth/success?accessToken=${encodeURIComponent(result.accessToken)}&refreshToken=${encodeURIComponent(result.refreshToken)}`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }
}