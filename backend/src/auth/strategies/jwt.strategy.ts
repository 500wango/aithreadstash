import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    console.log('JWT Strategy constructor called');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'dev-jwt-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload);
    return { 
      sub: payload.sub, 
      email: payload.email,
      subscriptionStatus: payload.subscriptionStatus 
    };
  }
}