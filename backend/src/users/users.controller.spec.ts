import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../database/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
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
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            updateProfile: jest.fn(),
            changePassword: jest.fn(),
            getUserStats: jest.fn(),
            getUserActivity: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('getProfile', () => {
    it('应该返回用户资料（不包含密码）', async () => {
      const result = await controller.getProfile(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        subscriptionStatus: mockUser.subscriptionStatus,
        stripeCustomerId: mockUser.stripeCustomerId,
        stripeSubscriptionId: mockUser.stripeSubscriptionId,
        notionAccessToken: mockUser.notionAccessToken,
        notionDatabaseId: mockUser.notionDatabaseId,
        googleId: mockUser.googleId,
        githubId: mockUser.githubId,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        conversations: mockUser.conversations,
      });
    });
  });

  describe('updateProfile', () => {
    it('应该成功更新用户资料', async () => {
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateData };
      
      jest.spyOn(usersService, 'updateProfile').mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockUser, updateData);

      expect(result).toEqual(updatedUser);
      expect(usersService.updateProfile).toHaveBeenCalledWith(mockUser.id, updateData);
    });
  });

  describe('changePassword', () => {
    it('应该成功更改密码', async () => {
      const changePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123'
      };
      
      jest.spyOn(usersService, 'changePassword').mockResolvedValue(true);

      const result = await controller.changePassword(mockUser, changePasswordDto);

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );
    });

    it('当前密码错误时应该抛出异常', async () => {
      const changePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };
      
      jest.spyOn(usersService, 'changePassword').mockResolvedValue(false);

      await expect(
        controller.changePassword(mockUser, changePasswordDto)
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('getUserStats', () => {
    it('应该返回用户统计信息', async () => {
      const mockStats = {
        totalConversations: 5,
        activeConversations: 3,
        archivedConversations: 2,
        totalTokens: 1000,
        avgTokensPerConversation: 200,
        subscriptionStatus: 'free' as 'free' | 'pro',
        memberSince: new Date(),
        lastActive: new Date(),
        modelsUsed: ['gpt-4', 'gpt-3.5-turbo'],
        tagsUsed: ['work', 'personal']
      };
      
      jest.spyOn(usersService, 'getUserStats').mockResolvedValue(mockStats);

      const result = await controller.getUserStats(mockUser);

      expect(result).toEqual(mockStats);
      expect(usersService.getUserStats).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getUserActivity', () => {
    it('应该返回用户活动记录', async () => {
      const mockActivity = {
        activityByDate: {
          '2024-01-01': 2,
          '2024-01-02': 3
        },
        recentActivity: [
          {
            id: 1,
            title: 'Test Conversation',
            action: 'created',
            timestamp: new Date(),
            model: 'gpt-4',
            tokenCount: 100
          }
        ],
        totalActiveDays: 2,
        avgConversationsPerDay: 3
      };
      
      jest.spyOn(usersService, 'getUserActivity').mockResolvedValue(mockActivity);

      const result = await controller.getUserActivity(mockUser);

      expect(result).toEqual(mockActivity);
      expect(usersService.getUserActivity).toHaveBeenCalledWith(mockUser.id);
    });
  });
});