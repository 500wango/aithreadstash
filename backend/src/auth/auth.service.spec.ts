import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { User } from '../database/user.entity';

jest.mock('bcryptjs');
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {},
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({}),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    subscriptionStatus: 'free',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    conversations: [],
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mockJwtToken'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            // 缺省返回 undefined，避免触发发信逻辑
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validateUser', () => {
    it('should validate user successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.validateUser({ sub: mockUser.id });

      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser({ sub: 999 });

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and return JWT tokens', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');
      
      const result = await service.login('test@example.com', 'password');

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        subscriptionStatus: mockUser.subscriptionStatus,
      }, { expiresIn: '1h' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        subscriptionStatus: mockUser.subscriptionStatus,
      }, { expiresIn: '7d' });
    });

    it('should throw exception when user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw exception when password is incorrect', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');

      const result = await service.register(email, password);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        email,
        password: 'hashedPassword',
        subscriptionStatus: 'free',
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('邮箱已存在时应该抛出异常', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.register(email, password)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOrCreateGoogleUser', () => {
    it('应该找到已存在的Google用户', async () => {
      const googleUser = {
        id: 'google123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');

      const result = await service.findOrCreateGoogleUser(googleUser);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: googleUser.email,
          googleId: googleUser.id
        }
      });
    });

    it('应该更新现有用户的Google ID', async () => {
      const googleUser = {
        id: 'google123',
        email: 'existing@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      const existingUser = { ...mockUser, googleId: null };

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null) // 第一次查找Google用户
        .mockResolvedValueOnce(existingUser); // 第二次查找邮箱用户

      jest.spyOn(userRepository, 'save').mockResolvedValue({ 
        ...existingUser, 
        googleId: googleUser.id 
      });
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');

      const result = await service.findOrCreateGoogleUser(googleUser);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...existingUser,
        googleId: googleUser.id
      });
    });

    it('应该创建新的Google用户', async () => {
      const googleUser = {
        id: 'google123',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User'
      };

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null) // 第一次查找Google用户
        .mockResolvedValueOnce(null); // 第二次查找邮箱用户

      const newUser = {
        ...mockUser,
        email: googleUser.email,
        googleId: googleUser.id,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        password: ''
      };

      jest.spyOn(userRepository, 'create').mockReturnValue(newUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(newUser);
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');

      const result = await service.findOrCreateGoogleUser(googleUser);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        email: googleUser.email,
        googleId: googleUser.id,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        subscriptionStatus: 'free',
        password: ''
      });
    });
  });

  describe('findOrCreateGitHubUser', () => {
    it('应该找到已存在的GitHub用户', async () => {
      const githubUser = {
        id: 'github123',
        email: 'test@example.com',
        username: 'testuser'
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');

      const result = await service.findOrCreateGitHubUser(githubUser);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: githubUser.email,
          githubId: githubUser.id
        }
      });
    });

    it('应该更新现有用户的GitHub ID', async () => {
      const githubUser = {
        id: 'github123',
        email: 'existing@example.com',
        username: 'testuser'
      };

      const existingUser = { ...mockUser, githubId: null };

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null) // 第一次查找GitHub用户
        .mockResolvedValueOnce(existingUser); // 第二次查找邮箱用户

      jest.spyOn(userRepository, 'save').mockResolvedValue({ 
        ...existingUser, 
        githubId: githubUser.id 
      });
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');

      const result = await service.findOrCreateGitHubUser(githubUser);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...existingUser,
        githubId: githubUser.id
      });
    });

    it('应该创建新的GitHub用户', async () => {
      const githubUser = {
        id: 'github123',
        email: 'new@example.com',
        username: 'newuser'
      };

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(null) // 第一次查找GitHub用户
        .mockResolvedValueOnce(null); // 第二次查找邮箱用户

      const newUser = {
        ...mockUser,
        email: githubUser.email,
        githubId: githubUser.id,
        firstName: githubUser.username,
        password: ''
      };

      jest.spyOn(userRepository, 'create').mockReturnValue(newUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(newUser);
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');

      const result = await service.findOrCreateGitHubUser(githubUser);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        email: githubUser.email,
        githubId: githubUser.id,
        firstName: githubUser.username,
        subscriptionStatus: 'free',
        password: ''
      });
    });
  });

  describe('generateTokens', () => {
    it('应该生成JWT令牌', () => {
      jwtService.sign = jest.fn()
        .mockReturnValueOnce('mockAccessToken')
        .mockReturnValueOnce('mockRefreshToken');
      
      const result = service['generateTokens'](mockUser);

      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        subscriptionStatus: mockUser.subscriptionStatus,
      }, { expiresIn: '1h' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        subscriptionStatus: mockUser.subscriptionStatus,
      }, { expiresIn: '7d' });
    });
  });

  describe('requestPasswordReset', () => {
    it('should generate a reset token and persist hash/expiry when user exists (non-production)', async () => {
      const email = 'reset@example.com';
      const existing = { ...mockUser, email } as User;
      let savedUserArg: User | undefined;

      (userRepository.findOne as jest.Mock).mockResolvedValue(existing);
      (userRepository.save as jest.Mock).mockImplementation(async (u: User) => {
        savedUserArg = u;
        return u;
      });

      const result = await service.requestPasswordReset(email);

      expect(result.message).toContain('reset');
      expect(result.token).toBeDefined();
      expect(result.resetUrl).toBeDefined();
      expect(savedUserArg?.resetPasswordTokenHash).toBeDefined();
      expect(savedUserArg?.resetPasswordTokenHash!.length).toBe(64);
      expect(savedUserArg?.resetPasswordExpiresAt).toBeInstanceOf(Date);
      expect((savedUserArg!.resetPasswordExpiresAt!.getTime() - Date.now())).toBeGreaterThan(0);
    });

    it('should return generic message even if user does not exist', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.requestPasswordReset('nouser@example.com');
      expect(result.message).toBeDefined();
    });
  });

  describe('verifyResetToken', () => {
    it('should return valid=true for non-expired token with matching hash', async () => {
      const token = 'a'.repeat(64); // arbitrary token value
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const userWithToken: User = {
        ...mockUser,
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      } as any;

      (userRepository.findOne as jest.Mock).mockImplementation(({ where }) => {
        if (where && where.resetPasswordTokenHash === tokenHash) {
          return Promise.resolve(userWithToken);
        }
        return Promise.resolve(null);
      });

      const res = await service.verifyResetToken(token);
      expect(res.valid).toBe(true);
    });

    it('should return valid=false for expired or invalid token', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      const res = await service.verifyResetToken('invalid');
      expect(res.valid).toBe(false);
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should reset password, clear token fields, and return new tokens', async () => {
      const token = 't'.repeat(64);
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const userWithToken: any = {
        ...mockUser,
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as User;

      (userRepository.findOne as jest.Mock).mockImplementation(({ where }) => {
        if (where && where.resetPasswordTokenHash === tokenHash) {
          return Promise.resolve(userWithToken);
        }
        return Promise.resolve(null);
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');
      (userRepository.save as jest.Mock).mockImplementation(async (u: User) => u);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('newAccess')
        .mockReturnValueOnce('newRefresh');

      const result = await service.resetPasswordWithToken(token, 'NewPass123!');

      expect(userWithToken.password).toBe('newHashed');
      expect(userWithToken.resetPasswordTokenHash).toBeNull();
      expect(userWithToken.resetPasswordExpiresAt).toBeNull();
      expect(result).toEqual({ accessToken: 'newAccess', refreshToken: 'newRefresh' });
    });

    it('should throw for invalid/expired token', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.resetPasswordWithToken('bad', 'NewPass123!')).rejects.toThrow(BadRequestException);
    });
  });
});