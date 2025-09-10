import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { AuthController } from './auth.controller';
import { GoogleAuthController } from './google-auth.controller';
import { GitHubAuthController } from './github-auth.controller';
import { GoogleOAuthSimpleService } from './google-oauth-simple.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../database/user.entity';

// Determine whether to enable OAuth strategies based on env flags
const enableGoogle = String(process.env.ENABLE_GOOGLE_OAUTH || '0').toLowerCase() !== '0' && String(process.env.ENABLE_GOOGLE_OAUTH || '0').toLowerCase() !== 'false';
const enableGithub = String(process.env.ENABLE_GITHUB_OAUTH || '0').toLowerCase() !== '0' && String(process.env.ENABLE_GITHUB_OAUTH || '0').toLowerCase() !== 'false';

const strategyProviders = [
  JwtStrategy,
  ...(enableGoogle ? [GoogleStrategy] : []),
  ...(enableGithub ? [GitHubStrategy] : []),
];

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, SessionService, GoogleOAuthSimpleService, ...strategyProviders],
  controllers: [AuthController, GoogleAuthController, GitHubAuthController],
})
export class AuthModule {}