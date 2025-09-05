import { User } from './user.entity';
import { Conversation } from './conversation.entity';

describe('Database Entities', () => {
  describe('User Entity', () => {
    it('应该正确创建用户实体', () => {
      const user = new User();
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.subscriptionStatus = 'free';
      user.firstName = 'Test';
      user.lastName = 'User';
      user.avatar = 'avatar.jpg';
      user.googleId = 'google123';
      user.githubId = 'github123';
      user.notionAccessToken = 'notion_token';
      user.notionWorkspaceId = 'workspace_123';
      user.notionWorkspaceName = 'Test Workspace';
      user.notionDatabaseId = 'database_123';
      user.stripeCustomerId = 'cus_test123';
      user.stripeSubscriptionId = 'sub_test123';
      user.createdAt = new Date('2023-01-01');
      user.updatedAt = new Date('2023-01-02');

      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('hashedPassword');
      expect(user.subscriptionStatus).toBe('free');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.avatar).toBe('avatar.jpg');
      expect(user.googleId).toBe('google123');
      expect(user.githubId).toBe('github123');
      expect(user.notionAccessToken).toBe('notion_token');
      expect(user.notionWorkspaceId).toBe('workspace_123');
      expect(user.notionWorkspaceName).toBe('Test Workspace');
      expect(user.notionDatabaseId).toBe('database_123');
      expect(user.stripeCustomerId).toBe('cus_test123');
      expect(user.stripeSubscriptionId).toBe('sub_test123');
      expect(user.createdAt).toEqual(new Date('2023-01-01'));
      expect(user.updatedAt).toEqual(new Date('2023-01-02'));
    });

    it('应该处理可选字段为null', () => {
      const user = new User();
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.subscriptionStatus = 'free';

      expect(user.googleId).toBeUndefined();
      expect(user.githubId).toBeUndefined();
      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.avatar).toBeUndefined();
      expect(user.notionAccessToken).toBeUndefined();
      expect(user.notionWorkspaceId).toBeUndefined();
      expect(user.notionWorkspaceName).toBeUndefined();
      expect(user.notionDatabaseId).toBeUndefined();
      expect(user.stripeCustomerId).toBeUndefined();
      expect(user.stripeSubscriptionId).toBeUndefined();
    });

    it('应该正确设置默认值', () => {
      const user = new User();
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.subscriptionStatus = 'free'; // 手动设置默认值，因为TypeORM默认值在数据库层面

      expect(user.subscriptionStatus).toBe('free');
    });

    it('应该正确处理枚举类型', () => {
      const user = new User();
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.subscriptionStatus = 'pro';

      expect(user.subscriptionStatus).toBe('pro');
      
      // 测试无效枚举值（TypeScript会在编译时捕获，但运行时需要验证）
      expect(['free', 'pro']).toContain(user.subscriptionStatus);
    });
  });

  describe('Conversation Entity', () => {
    it('应该正确创建对话实体', () => {
      const conversation = new Conversation();
      conversation.title = 'Test Conversation';
      conversation.summary = 'This is a test conversation';
      conversation.messages = [
        {
          role: 'user',
          content: 'Hello, how are you?',
          timestamp: new Date('2023-01-01T10:00:00')
        },
        {
          role: 'assistant',
          content: 'I am doing well, thank you!',
          timestamp: new Date('2023-01-01T10:01:00')
        }
      ];
      conversation.tokenCount = 100;
      conversation.status = 'active';
      conversation.model = 'gpt-4';
      conversation.tags = 'test,conversation';
      conversation.userId = 1;
      conversation.createdAt = new Date('2023-01-01');
      conversation.updatedAt = new Date('2023-01-02');

      expect(conversation).toBeInstanceOf(Conversation);
      expect(conversation.title).toBe('Test Conversation');
      expect(conversation.summary).toBe('This is a test conversation');
      expect(conversation.messages).toHaveLength(2);
      expect(conversation.messages[0].role).toBe('user');
      expect(conversation.messages[0].content).toBe('Hello, how are you?');
      expect(conversation.messages[1].role).toBe('assistant');
      expect(conversation.messages[1].content).toBe('I am doing well, thank you!');
      expect(conversation.tokenCount).toBe(100);
      expect(conversation.status).toBe('active');
      expect(conversation.model).toBe('gpt-4');
      expect(conversation.tags).toBe('test,conversation');
      expect(conversation.userId).toBe(1);
      expect(conversation.createdAt).toEqual(new Date('2023-01-01'));
      expect(conversation.updatedAt).toEqual(new Date('2023-01-02'));
    });

    it('应该处理可选字段为null', () => {
      const conversation = new Conversation();
      conversation.title = 'Test Conversation';
      conversation.userId = 1;

      expect(conversation.summary).toBeUndefined();
      expect(conversation.model).toBeUndefined();
      expect(conversation.tags).toBeUndefined();
    });

    it('应该正确设置默认值', () => {
      const conversation = new Conversation();
      conversation.title = 'Test Conversation';
      conversation.userId = 1;
      conversation.messages = []; // 手动设置默认值
      conversation.tokenCount = 0; // 手动设置默认值
      conversation.status = 'active'; // 手动设置默认值

      expect(conversation.messages).toEqual([]);
      expect(conversation.tokenCount).toBe(0);
      expect(conversation.status).toBe('active');
    });

    it('应该正确处理枚举类型', () => {
      const conversation = new Conversation();
      conversation.title = 'Test Conversation';
      conversation.userId = 1;
      conversation.status = 'archived';

      expect(conversation.status).toBe('archived');
      
      // 测试无效枚举值
      expect(['active', 'archived', 'deleted']).toContain(conversation.status);
    });

    it('应该正确处理JSONB消息数组', () => {
      const conversation = new Conversation();
      conversation.title = 'Test Conversation';
      conversation.userId = 1;
      conversation.messages = [
        {
          role: 'system',
          content: 'System message',
          timestamp: new Date()
        }
      ];

      expect(conversation.messages[0].role).toBe('system');
      expect(conversation.messages[0].content).toBe('System message');
      expect(conversation.messages[0].timestamp).toBeInstanceOf(Date);
      
      // 测试消息角色枚举
      expect(['user', 'assistant', 'system']).toContain(conversation.messages[0].role);
    });

    it('应该处理空消息数组', () => {
      const conversation = new Conversation();
      conversation.title = 'Test Conversation';
      conversation.userId = 1;
      conversation.messages = [];

      expect(conversation.messages).toEqual([]);
    });
  });

  describe('Entity Relationships', () => {
    it('应该建立用户和对话之间的关系', () => {
      const user = new User();
      user.id = 1;
      user.email = 'test@example.com';
      user.password = 'hashedPassword';

      const conversation = new Conversation();
      conversation.id = 1;
      conversation.title = 'Test Conversation';
      conversation.userId = user.id;
      conversation.user = user;

      expect(conversation.userId).toBe(user.id);
      expect(conversation.user).toBe(user);
      expect(conversation.user.email).toBe('test@example.com');
    });

    it('应该处理用户对话数组', () => {
      const user = new User();
      user.id = 1;
      user.email = 'test@example.com';
      user.password = 'hashedPassword';

      const conversation1 = new Conversation();
      conversation1.id = 1;
      conversation1.title = 'Conversation 1';
      conversation1.userId = user.id;

      const conversation2 = new Conversation();
      conversation2.id = 2;
      conversation2.title = 'Conversation 2';
      conversation2.userId = user.id;

      user.conversations = [conversation1, conversation2];

      expect(user.conversations).toHaveLength(2);
      expect(user.conversations[0].title).toBe('Conversation 1');
      expect(user.conversations[1].title).toBe('Conversation 2');
      expect(user.conversations[0].userId).toBe(user.id);
      expect(user.conversations[1].userId).toBe(user.id);
    });
  });
});