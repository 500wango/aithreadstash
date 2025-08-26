import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotionService } from './notion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../database/user.entity';

@Controller('notion')
@UseGuards(JwtAuthGuard)
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

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
    // This endpoint would handle the OAuth callback from Notion
    // For now, we'll return the code and state for the frontend to handle
    return { 
      message: 'OAuth callback received', 
      code, 
      state 
    };
  }
}