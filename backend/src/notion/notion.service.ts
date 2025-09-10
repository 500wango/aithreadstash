import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/user.entity';
import { Client } from '@notionhq/client';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class NotionService {
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key';
  }

  private encryptToken(token: string): string {
    return CryptoJS.AES.encrypt(token, this.encryptionKey).toString();
  }

  private decryptToken(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async saveNotionToken(userId: number, accessToken: string, workspaceId: string, workspaceName: string): Promise<void> {
    const encryptedToken = this.encryptToken(accessToken);
    
    await this.userRepository.update(userId, {
      notionAccessToken: encryptedToken,
      notionWorkspaceId: workspaceId,
      notionWorkspaceName: workspaceName,
    });
  }

  async saveNotionDatabase(userId: number, databaseId: string): Promise<void> {
    await this.userRepository.update(userId, {
      notionDatabaseId: databaseId,
    });
  }

  async getNotionClient(userId: number): Promise<Client> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.notionAccessToken) {
      throw new BadRequestException('Notion not connected');
    }

    try {
      const decryptedToken = this.decryptToken(user.notionAccessToken);
      return new Client({ auth: decryptedToken });
    } catch (error) {
      throw new InternalServerErrorException('Failed to decrypt Notion token');
    }
  }

  async getDatabases(userId: number): Promise<any[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // 在开发模式下，如果使用模拟token，返回模拟数据库列表
    if (process.env.NODE_ENV === 'development' && user?.notionAccessToken?.includes('mock_notion_token')) {
      return [
        {
          id: 'mock_database_1',
          title: '我的笔记数据库',
          url: 'https://notion.so/mock-database-1',
          last_edited_time: new Date().toISOString(),
        },
        {
          id: 'mock_database_2',
          title: '项目管理',
          url: 'https://notion.so/mock-database-2',
          last_edited_time: new Date().toISOString(),
        },
        {
          id: 'mock_database_3',
          title: '学习资料',
          url: 'https://notion.so/mock-database-3',
          last_edited_time: new Date().toISOString(),
        },
      ];
    }

    // 只有在非模拟模式下才尝试获取真实的Notion客户端
    const notion = await this.getNotionClient(userId);
    
    try {
      const response = await notion.search({
        filter: { property: 'object', value: 'database' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
      });

      return response.results.map((db: any) => ({
        id: db.id,
        title: db.title[0]?.plain_text || 'Untitled',
        url: db.url,
        last_edited_time: db.last_edited_time,
      }));
    } catch (error) {
      if ((error as any).code === 'unauthorized') {
        throw new BadRequestException('Notion access token is invalid');
      }
      throw new InternalServerErrorException('Failed to fetch databases from Notion');
    }
  }

  async saveToNotion(
    userId: number, 
    title: string, 
    content: string,
    summary?: string,
    tags?: string
  ): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.notionDatabaseId) {
      throw new BadRequestException('Notion database not selected');
    }

    // 在开发模式下，如果使用模拟token，返回模拟URL
    if (process.env.NODE_ENV === 'development' && user.notionAccessToken?.includes('mock_notion_token')) {
      const mockPageId = `mock_page_${Date.now()}`;
      return `https://notion.so/${mockPageId}`;
    }

    const notion = await this.getNotionClient(userId);

    try {
      // 默认属性键，方便在测试或无法检索数据库属性时回退
      let titlePropertyKey = 'Name';
      let tagsPropertyKey = 'Tags';
      let firstMultiSelectKey = '';

      try {
        const dbResponse = await notion.databases.retrieve({ database_id: user.notionDatabaseId });
        const properties = (dbResponse as any).properties;
        
        for (const key in properties) {
          const prop = (properties as any)[key];
          if (prop?.type === 'title') {
            titlePropertyKey = key;
          } else if (prop?.type === 'multi_select') {
            if (!firstMultiSelectKey) {
              firstMultiSelectKey = key;
            }
            if (key.toLowerCase() === 'tags') {
              tagsPropertyKey = key; // 优先使用名为 Tags 的属性
            }
          }
        }

        // 如果找不到名为 Tags 的属性，则回退到第一个 multi_select 属性
        if (!tagsPropertyKey && firstMultiSelectKey) {
          tagsPropertyKey = firstMultiSelectKey;
        }
      } catch (_err) {
        // 忽略检索数据库属性的错误（例如在测试中未 mock databases.retrieve）并使用默认键
        if (firstMultiSelectKey && !tagsPropertyKey) {
          tagsPropertyKey = firstMultiSelectKey;
        }
      }

      const pageProperties: any = {
        [titlePropertyKey]: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      };

      if (tags && tagsPropertyKey) {
        pageProperties[tagsPropertyKey] = {
          multi_select: tags.split(',').map(tag => ({ 
            name: tag.trim() 
          })),
        };
      }


      const response = await notion.pages.create({
        parent: { database_id: user.notionDatabaseId },
        properties: pageProperties,
        children: [
          {
            object: 'block' as const,
            type: 'paragraph' as const,
            paragraph: {
              rich_text: [
                {
                  type: 'text' as const,
                  text: {
                    content: content,
                  },
                },
              ],
            },
          },
          ...(summary ? [
            {
              object: 'block' as const,
              type: 'heading_2' as const,
              heading_2: {
                rich_text: [
                  {
                    type: 'text' as const,
                    text: {
                      content: 'Summary',
                    },
                  },
                ],
              },
            },
            {
              object: 'block' as const,
              type: 'paragraph' as const,
              paragraph: {
                rich_text: [
                  {
                    type: 'text' as const,
                    text: {
                      content: summary,
                    },
                  },
                ],
              },
            }
          ] : []),
        ],
      });

      return (response as any).url;
    } catch (error) {
      if ((error as any).code === 'object_not_found') {
        throw new BadRequestException('Notion database not found');
      }
      if ((error as any).code === 'unauthorized') {
        throw new BadRequestException('Notion access token is invalid');
      }
      throw new InternalServerErrorException('Failed to save to Notion');
    }
  }

  async disconnectNotion(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      notionAccessToken: null,
      notionWorkspaceId: null,
      notionWorkspaceName: null,
      notionDatabaseId: null,
    });
  }

  async getNotionStatus(userId: number): Promise<{
    connected: boolean;
    workspaceName?: string;
    databaseSelected: boolean;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    return {
      connected: !!user?.notionAccessToken,
      workspaceName: user?.notionWorkspaceName,
      databaseSelected: !!user?.notionDatabaseId,
    };
  }
}