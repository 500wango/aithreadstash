import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../database/user.entity';
import { Conversation } from '../database/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Conversation])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}