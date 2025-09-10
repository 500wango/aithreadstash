import { Test, TestingModule } from '@nestjs/testing';
import { NotionController } from './notion.controller';
import { NotionService } from './notion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../database/user.entity';
import { ConfigService } from '@nestjs/config';

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

describe('NotionController', () => {
  let controller: NotionController;
  let notionService: NotionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotionController],
      providers: [
        {
          provide: NotionService,
          useValue: {
            saveNotionToken: jest.fn(),
            saveNotionDatabase: jest.fn(),
            getDatabases: jest.fn(),
            saveToNotion: jest.fn(),
            disconnectNotion: jest.fn(),
            getNotionStatus: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'API_URL':
                  return 'http://localhost:3000';
                case 'FRONTEND_URL':
                  return 'http://localhost:3000';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotionController>(NotionController);
    notionService = module.get<NotionService>(NotionService);
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('connectNotion', () => {
    it('应该成功连接Notion', async () => {
      const body = {
        accessToken: 'test_token',
        workspaceId: 'workspace_123',
        workspaceName: 'Test Workspace',
      };

      jest.spyOn(notionService, 'saveNotionToken').mockResolvedValue();

      const result = await controller.connectNotion(mockUser, body);

      expect(result).toEqual({ message: 'Notion connected successfully' });
      expect(notionService.saveNotionToken).toHaveBeenCalledWith(
        mockUser.id,
        body.accessToken,
        body.workspaceId,
        body.workspaceName
      );
    });
  });

  describe('selectDatabase', () => {
    it('应该成功选择数据库', async () => {
      const body = { databaseId: 'database_123' };

      jest.spyOn(notionService, 'saveNotionDatabase').mockResolvedValue();

      const result = await controller.selectDatabase(mockUser, body);

      expect(result).toEqual({ message: 'Database selected successfully' });
      expect(notionService.saveNotionDatabase).toHaveBeenCalledWith(mockUser.id, body.databaseId);
    });
  });

  describe('getDatabases', () => {
    it('应该成功获取数据库列表', async () => {
      const mockDatabases = [
        {
          id: 'db1',
          title: 'Database 1',
          url: 'https://notion.so/db1',
          last_edited_time: '2023-01-01T00:00:00.000Z',
        },
      ];

      jest.spyOn(notionService, 'getDatabases').mockResolvedValue(mockDatabases);

      const result = await controller.getDatabases(mockUser);

      expect(result).toEqual({ databases: mockDatabases });
      expect(notionService.getDatabases).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('saveToNotion', () => {
    it('应该成功保存到Notion', async () => {
      const body = {
        title: 'Test Title',
        content: 'Test Content',
        summary: 'Test Summary',
        tags: 'tag1,tag2',
      };
      const pageUrl = 'https://notion.so/page123';

      jest.spyOn(notionService, 'saveToNotion').mockResolvedValue(pageUrl);

      const result = await controller.saveToNotion(mockUser, body);

      expect(result).toEqual({
        message: 'Saved to Notion successfully',
        url: pageUrl,
      });
      expect(notionService.saveToNotion).toHaveBeenCalledWith(
        mockUser.id,
        body.title,
        body.content,
        body.summary,
        body.tags
      );
    });

    it('没有可选参数时应该正常工作', async () => {
      const body = {
        title: 'Test Title',
        content: 'Test Content',
      };
      const pageUrl = 'https://notion.so/page123';

      jest.spyOn(notionService, 'saveToNotion').mockResolvedValue(pageUrl);

      const result = await controller.saveToNotion(mockUser, body);

      expect(result).toEqual({
        message: 'Saved to Notion successfully',
        url: pageUrl,
      });
      expect(notionService.saveToNotion).toHaveBeenCalledWith(
        mockUser.id,
        body.title,
        body.content,
        undefined,
        undefined
      );
    });
  });

  describe('disconnectNotion', () => {
    it('应该成功断开Notion连接', async () => {
      jest.spyOn(notionService, 'disconnectNotion').mockResolvedValue();

      const result = await controller.disconnectNotion(mockUser);

      expect(result).toEqual({ message: 'Notion disconnected successfully' });
      expect(notionService.disconnectNotion).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getStatus', () => {
    it('应该成功获取Notion状态', async () => {
      const mockStatus = {
        connected: true,
        workspaceName: 'Test Workspace',
        databaseSelected: true,
      };

      jest.spyOn(notionService, 'getNotionStatus').mockResolvedValue(mockStatus);

      const result = await controller.getStatus(mockUser);

      expect(result).toEqual({ status: mockStatus });
      expect(notionService.getNotionStatus).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('oauthCallback', () => {
    it('应该成功处理OAuth回调', async () => {
      const code = 'oauth_code_123';
      const state = '1'; // 有效的用户ID
      
      // Mock fetch for token exchange
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'notion_access_token',
          workspace_id: 'workspace_123',
          workspace_name: 'Test Workspace'
        })
      });
      
      // Mock environment variables
      process.env.NOTION_CLIENT_ID = 'test_client_id';
      process.env.NOTION_CLIENT_SECRET = 'test_client_secret';
      process.env.API_URL = 'http://localhost:3000';
      
      jest.spyOn(notionService, 'saveNotionToken').mockResolvedValue();

      const result = await controller.oauthCallback(code, state);

      expect(result).toEqual({
        success: true,
        message: 'Notion connected successfully',
        workspaceName: 'Test Workspace'
      });
      
      expect(notionService.saveNotionToken).toHaveBeenCalledWith(
        1,
        'notion_access_token',
        'workspace_123',
        'Test Workspace'
      );
    });
    
    it('应该处理无效的state参数', async () => {
      const code = 'oauth_code_123';
      const state = 'invalid_state';

      await expect(controller.oauthCallback(code, state)).rejects.toThrow('Invalid state parameter');
    });
    
    it('应该处理token交换失败', async () => {
      const code = 'oauth_code_123';
      const state = '1';
      
      // Mock fetch to return error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      });
      
      process.env.NOTION_CLIENT_ID = 'test_client_id';
      process.env.NOTION_CLIENT_SECRET = 'test_client_secret';
      process.env.API_URL = 'http://localhost:3000';

      await expect(controller.oauthCallback(code, state)).rejects.toThrow('OAuth callback failed');
    });
  });
});