import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriveService } from './drive.service';
import { DriveController } from './drive.controller';
import { DriveMockController } from './drive-mock.controller';
import { User } from '../database/user.entity';
import { DriveOAuthController } from './drive-oauth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [DriveController, DriveMockController, DriveOAuthController],
  providers: [DriveService],
  exports: [DriveService],
})
export class DriveModule {}