import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { User } from '../database/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [NotionController],
  providers: [NotionService],
  exports: [NotionService],
})
export class NotionModule {}