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
      if (error.code === 'unauthorized') {
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

    const notion = await this.getNotionClient(userId);

    try {
      const response = await notion.pages.create({
        parent: { database_id: user.notionDatabaseId },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
          ...(tags && {
            Tags: {
              multi_select: tags.split(',').map(tag => ({ 
                name: tag.trim() 
              })),
            },
          }),
        },
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
      if (error.code === 'object_not_found') {
        throw new BadRequestException('Notion database not found');
      }
      if (error.code === 'unauthorized') {
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