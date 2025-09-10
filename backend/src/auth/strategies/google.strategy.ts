import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { SSL_OP_NO_TLSv1, SSL_OP_NO_TLSv1_1 } from 'node:constants';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  // 声明属性，但不要用参数属性，避免在 super() 前访问 this
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    // 在调用 super() 之前只能使用局部变量，不能使用 this
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.HTTP_PROXY ||
      process.env.ALL_PROXY ||
      configService.get<string>('HTTPS_PROXY') ||
      configService.get<string>('HTTP_PROXY') ||
      configService.get<string>('ALL_PROXY');

    const agent = proxyUrl
      ? new HttpsProxyAgent(proxyUrl)
      : new https.Agent({
          keepAlive: false,
          timeout: 60000,
          maxSockets: 1,
          maxFreeSockets: 1,
          rejectUnauthorized: false,
          secureOptions: SSL_OP_NO_TLSv1 | SSL_OP_NO_TLSv1_1,
        });

    // 为本地开发提供安全默认值，避免缺少环境变量导致构造失败
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || 'DUMMY_CLIENT_ID';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || 'DUMMY_CLIENT_SECRET';
    const callbackURL =
      configService.get<string>('GOOGLE_PASSPORT_CALLBACK_URL') ||
      configService.get<string>('GOOGLE_CALLBACK_URL') ||
      'http://localhost:3007/auth/google/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: false,
      skipUserProfile: false,
      customHeaders: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      agent,
    });

    // super() 之后再为类属性赋值
    this.configService = configService;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      id: profile.id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}