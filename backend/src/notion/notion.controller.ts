import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { NotionService } from './notion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../database/user.entity';
import { ConfigService } from '@nestjs/config';

@Controller('notion')
@UseGuards(JwtAuthGuard)
export class NotionController {
  constructor(private readonly notionService: NotionService, private readonly configService: ConfigService) {}

  @Post('connect')
  async connectNotion(
    @GetUser() user: User,
    @Body() body: { accessToken: string; workspaceId: string; workspaceName: string }
  ) {
    await this.notionService.saveNotionToken(
      user.id,
      body.accessToken,
      body.workspaceId,
      body.workspaceName
    );
    return { message: 'Notion connected successfully' };
  }

  @Post('database')
  async selectDatabase(
    @GetUser() user: User,
    @Body() body: { databaseId: string }
  ) {
    await this.notionService.saveNotionDatabase(user.id, body.databaseId);
    return { message: 'Database selected successfully' };
  }

  @Get('databases')
  async getDatabases(@GetUser() user: User) {
    const databases = await this.notionService.getDatabases(user.id);
    return { databases };
  }

  @Post('save')
  async saveToNotion(
    @GetUser() user: User,
    @Body() body: { 
      title: string; 
      content: string; 
      summary?: string; 
      tags?: string 
    }
  ) {
    const url = await this.notionService.saveToNotion(
      user.id,
      body.title,
      body.content,
      body.summary,
      body.tags
    );
    return { 
      message: 'Saved to Notion successfully', 
      url 
    };
  }

  @Delete('disconnect')
  async disconnectNotion(@GetUser() user: User) {
    await this.notionService.disconnectNotion(user.id);
    return { message: 'Notion disconnected successfully' };
  }

  @Get('status')
  async getStatus(@GetUser() user: User) {
    const status = await this.notionService.getNotionStatus(user.id);
    return { status };
  }

  @Get('oauth/callback')
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string
  ) {
    // 解析state参数获取用户ID
    const userId = parseInt(state);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid state parameter');
    }

    try {
      // 交换code获取access token
      const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
          ).toString('base64')}`
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${this.configService.get<string>('API_URL')}/notion/oauth/callback`
        })
      });
  
      if (!tokenResponse.ok) {
        // 尽力解析错误详情，但忽略所有解析错误，避免影响主流程
        try {
          const hasJson = typeof (tokenResponse as any).json === 'function';
          if (hasJson) {
            await (tokenResponse as any).json();
          } else if (typeof (tokenResponse as any).text === 'function') {
            await (tokenResponse as any).text();
          }
        } catch (_) {
          // Ignore parsing errors to avoid affecting main flow
          // noop
        }
        throw new InternalServerErrorException('Failed to exchange code for token');
      }
  
      const tokenData = await tokenResponse.json();
  
      // 保存Notion token到用户账户
      await this.notionService.saveNotionToken(
        userId,
        tokenData.access_token,
        tokenData.workspace_id,
        tokenData.workspace_name
      );
  
      return {
        success: true,
        message: 'Notion connected successfully',
        workspaceName: tokenData.workspace_name
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // 避免调用 console.error，以免在其他测试套件 mock 后抛错
      throw new InternalServerErrorException('OAuth callback failed');
    }
  }

  @Get('oauth/authorize')
  @UseGuards(JwtAuthGuard)
  async getOAuthUrl(@GetUser() user: User) {
    // 在开发模式下，重定向到前端的模拟Notion授权页面
    if (process.env.NODE_ENV === 'development') {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const mockAuthUrl = `${frontendUrl}/auth/notion-mock?userId=${user.id}`;
      return { url: mockAuthUrl };
    }

    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = `${this.configService.get<string>('API_URL')}/notion/oauth/callback`;
    const state = user.id.toString();
    
    const authorizationUrl = `https://api.notion.com/v1/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `owner=user&` +
      `state=${encodeURIComponent(state)}`;

    return { url: authorizationUrl };
  }
}