import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../database/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async create(createConversationDto: CreateConversationDto, userId: number): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      ...createConversationDto,
      userId,
    });
    return await this.conversationRepository.save(conversation);
  }

  async findAllByUser(userId: number, status?: string): Promise<Conversation[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    return await this.conversationRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async update(id: number, updateConversationDto: UpdateConversationDto, userId: number): Promise<Conversation> {
    const conversation = await this.findOne(id, userId);
    Object.assign(conversation, updateConversationDto);
    return await this.conversationRepository.save(conversation);
  }

  async remove(id: number, userId: number): Promise<void> {
    const conversation = await this.findOne(id, userId);
    await this.conversationRepository.remove(conversation);
  }

  async archive(id: number, userId: number): Promise<Conversation> {
    const conversation = await this.findOne(id, userId);
    conversation.status = 'archived';
    return await this.conversationRepository.save(conversation);
  }

  async restore(id: number, userId: number): Promise<Conversation> {
    const conversation = await this.findOne(id, userId);
    conversation.status = 'active';
    return await this.conversationRepository.save(conversation);
  }

  async addMessage(id: number, message: { role: 'user' | 'assistant' | 'system'; content: string }, userId: number): Promise<Conversation> {
    const conversation = await this.findOne(id, userId);
    conversation.messages = [...conversation.messages, { ...message, timestamp: new Date() }];
    return await this.conversationRepository.save(conversation);
  }

  async getStatistics(userId: number): Promise<{ total: number; active: number; archived: number; totalTokens: number }> {
    const conversations = await this.conversationRepository.find({
      where: { userId },
    });

    return {
      total: conversations.length,
      active: conversations.filter(c => c.status === 'active').length,
      archived: conversations.filter(c => c.status === 'archived').length,
      totalTokens: conversations.reduce((sum, c) => sum + c.tokenCount, 0),
    };
  }
}