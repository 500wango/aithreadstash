import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotionController } from './notion.controller';
import { NotionMockController } from './notion-mock.controller';
import { NotionService } from './notion.service';
import { User } from '../database/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [NotionController, NotionMockController],
  providers: [NotionService],
  exports: [NotionService],
})
export class NotionModule {}