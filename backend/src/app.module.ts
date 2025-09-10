import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { NotionModule } from './notion/notion.module';
import { StripeModule } from './stripe/stripe.module';
import { UsersModule } from './users/users.module';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { HealthController } from './health/health.controller';
import { User } from './database/user.entity';
import { DriveModule } from './drive/drive.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    // 全局限流：默认 10 次 / 分钟
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    DatabaseModule,
    AuthModule,
    NotionModule,
    StripeModule,
    UsersModule,
    DriveModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}