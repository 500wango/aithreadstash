import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '740135',
      database: 'aithreadstash',
      entities: [User, Conversation],
      synchronize: process.env.NODE_ENV === 'development',
      logging: true,
    }),
    TypeOrmModule.forFeature([User, Conversation]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}