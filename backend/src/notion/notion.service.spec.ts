import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { NotionService } from './notion.service';
import { User } from '../database/user.entity';
import { Client } from '@notionhq/client';
import * as CryptoJS from 'crypto-js';

jest.mock('@notionhq/client');
jest.mock('crypto-js');

describe('NotionService', () => {
  let service: NotionService;
  let userRepository: Repository<User>;
  let mockNotionClient: jest.Mocked<Client>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    subscriptionStatus: 'free',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    notionAccessToken: 'encrypted_token',
    notionWorkspaceId: 'workspace_123',
    notionWorkspaceName: 'Test Workspace',
    notionDatabaseId: 'database_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    conversations: [],
  } as User;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    mockNotionClient = {
      search: jest.fn(),
      pages: {
        create: jest.fn(),
      },
    } as unknown as jest.Mocked<Client>;

    (Client as jest.MockedClass<typeof Client>).mockImplementation(() => mockNotionClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotionService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotionService>(NotionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    process.env.ENCRYPTION_KEY = 'test-encryption-key';
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('saveNotionToken', () => {
    it('应该成功保存加密的Notion token', async () => {
      const encryptedToken = 'encrypted_token_value';
      (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(encryptedToken),
      });

      await service.saveNotionToken(1, 'access_token', 'workspace_123', 'Test Workspace');

      expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith('access_token', 'test-encryption-key');
      expect(userRepository.update).toHaveBeenCalledWith(1, {
        notionAccessToken: encryptedToken,
        notionWorkspaceId: 'workspace_123',
        notionWorkspaceName: 'Test Workspace',
      });
    });
  });

  describe('saveNotionDatabase', () => {
    it('应该成功保存数据库ID', async () => {
      await service.saveNotionDatabase(1, 'database_123');

      expect(userRepository.update).toHaveBeenCalledWith(1, {
        notionDatabaseId: 'database_123',
      });
    });
  });

  describe('getNotionClient', () => {
    it('应该成功返回Notion客户端', async () => {
      const decryptedToken = 'decrypted_token';
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(decryptedToken),
      });

      const client = await service.getNotionClient(1);

      expect(client).toBe(mockNotionClient);
      expect(Client).toHaveBeenCalledWith({ auth: decryptedToken });
    });

    it('用户不存在时应该抛出BadRequestException', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getNotionClient(1)).rejects.toThrow(BadRequestException);
    });

    it('用户没有Notion token时应该抛出BadRequestException', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        notionAccessToken: null,
      });

      await expect(service.getNotionClient(1)).rejects.toThrow(BadRequestException);
    });

    it('解密失败时应该抛出InternalServerErrorException', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(service.getNotionClient(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getDatabases', () => {
    it('应该成功获取数据库列表', async () => {
      const mockDatabases = {
        results: [
          {
            id: 'db1',
            title: [{ plain_text: 'Database 1' }],
            url: 'https://notion.so/db1',
            last_edited_time: '2023-01-01T00:00:00.000Z',
          },
          {
            id: 'db2',
            title: [{ plain_text: 'Database 2' }],
            url: 'https://notion.so/db2',
            last_edited_time: '2023-01-02T00:00:00.000Z',
          },
        ],
      };

      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      mockNotionClient.search.mockResolvedValue(mockDatabases as any);

      const result = await service.getDatabases(1);

      expect(result).toEqual([
        {
          id: 'db1',
          title: 'Database 1',
          url: 'https://notion.so/db1',
          last_edited_time: '2023-01-01T00:00:00.000Z',
        },
        {
          id: 'db2',
          title: 'Database 2',
          url: 'https://notion.so/db2',
          last_edited_time: '2023-01-02T00:00:00.000Z',
        },
      ]);
    });

    it('应该处理无标题的数据库', async () => {
      const mockDatabases = {
        results: [
          {
            id: 'db1',
            title: [],
            url: 'https://notion.so/db1',
            last_edited_time: '2023-01-01T00:00:00.000Z',
          },
        ],
      };

      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      mockNotionClient.search.mockResolvedValue(mockDatabases as any);

      const result = await service.getDatabases(1);

      expect(result[0].title).toBe('Untitled');
    });

    it('token无效时应该抛出BadRequestException', async () => {
      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      const error = new Error('Unauthorized');
      (error as any).code = 'unauthorized';
      mockNotionClient.search.mockRejectedValue(error);

      await expect(service.getDatabases(1)).rejects.toThrow(BadRequestException);
    });

    it('其他错误时应该抛出InternalServerErrorException', async () => {
      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      mockNotionClient.search.mockRejectedValue(new Error('Network error'));

      await expect(service.getDatabases(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('saveToNotion', () => {
    it('应该成功保存到Notion', async () => {
      const pageUrl = 'https://notion.so/page123';
      const mockResponse = { url: pageUrl };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      (mockNotionClient.pages.create as jest.Mock).mockResolvedValue(mockResponse as any);

      const result = await service.saveToNotion(1, 'Test Title', 'Test Content', 'Test Summary', 'tag1,tag2');

      expect(result).toBe(pageUrl);
      expect(mockNotionClient.pages.create).toHaveBeenCalledWith({
        parent: { database_id: 'database_123' },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: 'Test Title',
                },
              },
            ],
          },
          Tags: {
            multi_select: [
              { name: 'tag1' },
              { name: 'tag2' },
            ],
          },
        },
        children: expect.arrayContaining([
          expect.objectContaining({
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Test Content',
                  },
                },
              ],
            },
          }),
        ]),
      });
    });

    it('没有tags时应该正常工作', async () => {
      const pageUrl = 'https://notion.so/page123';
      const mockResponse = { url: pageUrl };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      (mockNotionClient.pages.create as jest.Mock).mockResolvedValue(mockResponse as any);

      await service.saveToNotion(1, 'Test Title', 'Test Content');

      expect(mockNotionClient.pages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: {
            Name: expect.any(Object),
          },
        })
      );
    });

    it('用户没有选择数据库时应该抛出BadRequestException', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        notionDatabaseId: null,
      });

      await expect(service.saveToNotion(1, 'Test Title', 'Test Content')).rejects.toThrow(BadRequestException);
    });

    it('数据库不存在时应该抛出BadRequestException', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      const error = new Error('Not found');
      (error as any).code = 'object_not_found';
      (mockNotionClient.pages.create as jest.Mock).mockRejectedValue(error);

      await expect(service.saveToNotion(1, 'Test Title', 'Test Content')).rejects.toThrow(BadRequestException);
    });

    it('token无效时应该抛出BadRequestException', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      const error = new Error('Unauthorized');
      (error as any).code = 'unauthorized';
      (mockNotionClient.pages.create as jest.Mock).mockRejectedValue(error);

      await expect(service.saveToNotion(1, 'Test Title', 'Test Content')).rejects.toThrow(BadRequestException);
    });

    it('其他错误时应该抛出InternalServerErrorException', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(service, 'getNotionClient').mockResolvedValue(mockNotionClient);
      (mockNotionClient.pages.create as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.saveToNotion(1, 'Test Title', 'Test Content')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('disconnectNotion', () => {
    it('应该成功断开Notion连接', async () => {
      await service.disconnectNotion(1);

      expect(userRepository.update).toHaveBeenCalledWith(1, {
        notionAccessToken: null,
        notionWorkspaceId: null,
        notionWorkspaceName: null,
        notionDatabaseId: null,
      });
    });
  });

  describe('getNotionStatus', () => {
    it('应该返回连接状态', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getNotionStatus(1);

      expect(result).toEqual({
        connected: true,
        workspaceName: 'Test Workspace',
        databaseSelected: true,
      });
    });

    it('应该返回未连接状态', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        notionAccessToken: null,
        notionWorkspaceName: null,
        notionDatabaseId: null,
      });

      const result = await service.getNotionStatus(1);

      expect(result).toEqual({
        connected: false,
        workspaceName: null,
        databaseSelected: false,
      });
    });

    it('用户不存在时应该返回未连接状态', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getNotionStatus(1);

      expect(result).toEqual({
        connected: false,
        workspaceName: undefined,
        databaseSelected: false,
      });
    });
  });
});