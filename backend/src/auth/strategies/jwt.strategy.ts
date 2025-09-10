import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (configService && configService.get<string>('JWT_SECRET')) || 'dev-jwt-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    const sub = payload?.sub;
    const user = await this.usersRepository.findOne({ where: { id: sub } });
    if (!user) {
      return null;
    }

    // Trial expiration guard: if trial has ended, clear trial flags and downgrade to free if needed
    if (user.onTrial && user.trialEndsAt) {
      const now = new Date();
      if (user.trialEndsAt.getTime() <= now.getTime()) {
        user.onTrial = false;
        user.trialEndsAt = null;
        if (user.subscriptionStatus !== 'pro') {
          user.subscriptionStatus = 'free';
        }
        await this.usersRepository.save(user);
      }
    }

    return user;
  }
}