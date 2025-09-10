import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UsersService } from './users.service';
import { User } from '../database/user.entity';
import { Conversation } from '../database/conversation.entity';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let conversationRepository: Repository<Conversation>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    subscriptionStatus: 'free',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    notionAccessToken: null,
    notionDatabaseId: null,
    googleId: null,
    githubId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    conversations: [],
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    conversationRepository = module.get<Repository<Conversation>>(getRepositoryToken(Conversation));
  });

  // UsersService 主要用于用户资料管理，不包含基础的查找方法
  // 这些方法在 AuthService 中实现

  describe('updateProfile', () => {
    it('应该成功更新用户资料', async () => {
      const updateData = { firstName: 'Updated', lastName: 'User' };
      const updatedUser = { ...mockUser, ...updateData };
      delete updatedUser.password; // updateProfile removes password from result

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue({ ...mockUser, ...updateData });

      const result = await service.updateProfile(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('用户不存在时应该抛出异常', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateProfile(999, { firstName: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('邮箱已存在时应该抛出异常', async () => {
      const existingUser = { ...mockUser, id: 2 };
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(mockUser) // 找到当前用户
        .mockResolvedValueOnce(existingUser); // 找到邮箱已存在的用户

      await expect(
        service.updateProfile(1, { email: 'existing@example.com' })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('changePassword', () => {
    it('应该成功更改密码', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'update').mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const result = await service.changePassword(1, 'currentPassword', 'newPassword');

      expect(result).toBe(true);
      expect(userRepository.update).toHaveBeenCalledWith(1, { password: 'newHashedPassword' });
    });

    it('当前密码错误时应该返回false', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.changePassword(1, 'wrongPassword', 'newPassword');

      expect(result).toBe(false);
    });

    it('用户不存在时应该抛出异常', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.changePassword(999, 'currentPassword', 'newPassword')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserStats', () => {
    it('应该返回用户统计信息', async () => {
      const mockConversations = [
        { id: 1, userId: 1, status: 'active', tokenCount: 100, model: 'gpt-4', tags: 'work,ai', createdAt: new Date() },
        { id: 2, userId: 1, status: 'archived', tokenCount: 200, model: 'gpt-3.5', tags: 'personal', createdAt: new Date() }
      ];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(conversationRepository, 'find').mockResolvedValue(mockConversations as any);

      const result = await service.getUserStats(1);

      expect(result.totalConversations).toBe(2);
      expect(result.activeConversations).toBe(1);
      expect(result.archivedConversations).toBe(1);
      expect(result.totalTokens).toBe(300);
      expect(result.subscriptionStatus).toBe('free');
    });

    it('用户不存在时应该抛出异常', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getUserStats(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserActivity', () => {
    it('应该返回用户活动信息', async () => {
      const mockConversations = [
        { id: 1, title: 'Test Chat', createdAt: new Date(), model: 'gpt-4', tokenCount: 100 },
        { id: 2, title: 'Another Chat', createdAt: new Date(), model: 'gpt-3.5', tokenCount: 150 }
      ];

      jest.spyOn(conversationRepository, 'find').mockResolvedValue(mockConversations as any);

      const result = await service.getUserActivity(1);

      expect(result.recentActivity).toHaveLength(2);
      expect(result.recentActivity[0].title).toBe('Test Chat');
      expect(result.totalActiveDays).toBeGreaterThan(0);
    });
  });
});