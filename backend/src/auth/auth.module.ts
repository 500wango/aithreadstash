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
import { GitHubMockController } from './github-mock.controller';
import { GoogleMockController } from './google-mock.controller';
import { GoogleSimpleController } from './google-simple.controller';
import { GoogleOAuthSimpleService } from './google-oauth-simple.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../database/user.entity';

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
  providers: [AuthService, SessionService, GoogleOAuthSimpleService, GoogleStrategy, GitHubStrategy, JwtStrategy],
  controllers: [AuthController, GoogleAuthController, GitHubAuthController, GitHubMockController, GoogleMockController, GoogleSimpleController],
})
export class AuthModule {}