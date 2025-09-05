import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { NotionService } from './notion.service';

@Controller('notion')
export class NotionMockController {
  constructor(private readonly notionService: NotionService) {}

  @Post('mock-connect')
  async mockConnect(
    @Body() body: { userId: number; workspaceName: string }
  ) {
    const { userId, workspaceName } = body;

    if (!userId || !workspaceName) {
      throw new BadRequestException('Missing userId or workspaceName');
    }

    try {
      // 生成模拟的Notion token和workspace数据
      const mockAccessToken = `mock_notion_token_${Date.now()}_${userId}`;
      const mockWorkspaceId = `mock_workspace_${userId}`;

      // 保存模拟的Notion连接信息
      await this.notionService.saveNotionToken(
        userId,
        mockAccessToken,
        mockWorkspaceId,
        workspaceName
      );

      return {
        success: true,
        message: 'Notion connected successfully (mock)',
        workspaceName,
        workspaceId: mockWorkspaceId
      };
    } catch (error) {
      console.error('Mock Notion connection error:', error);
      throw new BadRequestException('Failed to connect to Notion (mock)');
    }
  }
}