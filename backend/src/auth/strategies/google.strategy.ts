import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { SSL_OP_NO_TLSv1, SSL_OP_NO_TLSv1_1 } from 'node:constants';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_PASSPORT_CALLBACK_URL') || configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      // 添加这些选项来解决TLS连接问题
      passReqToCallback: false,
      skipUserProfile: false,
      // 添加自定义HTTPS代理来解决网络连接问题
      customHeaders: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      agent: new https.Agent({
        keepAlive: false,
        timeout: 60000,
        maxSockets: 1,
        maxFreeSockets: 1,
        rejectUnauthorized: false,
        secureOptions: SSL_OP_NO_TLSv1 | SSL_OP_NO_TLSv1_1,
      })
    });
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