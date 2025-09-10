import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/user.entity';
import { Conversation } from '../database/conversation.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async updateProfile(userId: number, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: updateData.email } 
      });
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    Object.assign(user, updateData);
    const { password, ...result } = await this.userRepository.save(user);
    return result as User;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return false;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { password: hashedNewPassword });

    return true;
  }

  async getUserStats(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const conversations = await this.conversationRepository.find({ where: { userId } });
    
    const stats = {
      totalConversations: conversations.length,
      activeConversations: conversations.filter(c => c.status === 'active').length,
      archivedConversations: conversations.filter(c => c.status === 'archived').length,
      totalTokens: conversations.reduce((sum, c) => sum + c.tokenCount, 0),
      avgTokensPerConversation: conversations.length > 0 
        ? Math.round(conversations.reduce((sum, c) => sum + c.tokenCount, 0) / conversations.length)
        : 0,
      subscriptionStatus: user.subscriptionStatus,
      memberSince: user.createdAt,
      lastActive: user.updatedAt,
      modelsUsed: [...new Set(conversations.filter(c => c.model).map(c => c.model))],
      tagsUsed: [...new Set(
        conversations
          .filter(c => c.tags)
          .flatMap(c => c.tags.split(',').map(tag => tag.trim()))
          .filter(tag => tag.length > 0)
      )],
    };

    return stats;
  }

  async getUserActivity(userId: number) {
    const conversations = await this.conversationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30 // Last 30 conversations
    });

    // Group by date for activity chart
    const activityByDate = conversations.reduce((acc, conv) => {
      const date = conv.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent activity
    const recentActivity = conversations.slice(0, 10).map(conv => ({
      id: conv.id,
      title: conv.title,
      action: 'created',
      timestamp: conv.createdAt,
      model: conv.model,
      tokenCount: conv.tokenCount
    }));

    return {
      activityByDate,
      recentActivity,
      totalActiveDays: Object.keys(activityByDate).length,
      avgConversationsPerDay: conversations.length > 0 
        ? Math.round(conversations.length / Math.max(Object.keys(activityByDate).length, 1))
        : 0
    };
  }
}