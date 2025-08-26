import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../database/user.entity';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Body() createConversationDto: CreateConversationDto, @GetUser() user: User) {
    return this.conversationsService.create(createConversationDto, user.id);
  }

  @Get()
  findAll(@GetUser() user: User, @Query('status') status?: string) {
    return this.conversationsService.findAllByUser(user.id, status);
  }

  @Get('statistics')
  getStatistics(@GetUser() user: User) {
    return this.conversationsService.getStatistics(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.conversationsService.findOne(+id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
    @GetUser() user: User,
  ) {
    return this.conversationsService.update(+id, updateConversationDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.conversationsService.remove(+id, user.id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @GetUser() user: User) {
    return this.conversationsService.archive(+id, user.id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @GetUser() user: User) {
    return this.conversationsService.restore(+id, user.id);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() message: { role: 'user' | 'assistant' | 'system'; content: string },
    @GetUser() user: User,
  ) {
    return this.conversationsService.addMessage(+id, message, user.id);
  }
}