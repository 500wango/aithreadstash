import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleOAuthSimpleService {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // Initialize global HTTP(S) proxy for fetch (Node/undici) if configured
    const proxyUrl =
      this.configService.get<string>('HTTPS_PROXY') ||
      this.configService.get<string>('HTTP_PROXY') ||
      this.configService.get<string>('ALL_PROXY');

    try {
      if (proxyUrl) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const undici = require('undici');
        undici.setGlobalDispatcher(new undici.ProxyAgent(proxyUrl));
      }
    } catch (err) {
      // no-op: proxy initialization failure should not crash the app
    }
  }

  // 生成Google OAuth授权URL
  getAuthUrl(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    const scope = 'email profile';
    const responseType = 'code';
    const state = Math.random().toString(36).substring(2, 15);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      response_type: responseType,
      state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // 处理OAuth回调（暂时返回错误信息）
  async handleCallback(code: string): Promise<any> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    try {
      // 换取access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new HttpException(`Failed to exchange token: ${errorData.error_description}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // 获取用户信息
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new HttpException('Failed to fetch user info', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const googleUser = await userResponse.json();
      return this.authService.findOrCreateGoogleUser(googleUser);

    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 模拟用户信息（仅用于测试）
  private createMockUser() {
    return {
      id: 'mock_google_user_' + Date.now(),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      picture: 'https://via.placeholder.com/150',
      provider: 'google'
    };
  }
}