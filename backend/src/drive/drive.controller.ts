import { Controller, Post, Get, Delete, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../database/user.entity';
import { DriveService } from './drive.service';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@UseGuards(JwtAuthGuard)
@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService, private readonly configService: ConfigService) {}

  @Post('connect')
  async connect(
    @GetUser() user: User,
    @Body() body: { accessToken: string; refreshToken?: string; folderId?: string; folderName?: string }
  ) {
    await this.driveService.connect(user.id, body.accessToken, body.refreshToken, body.folderId, body.folderName);
    return { message: 'Google Drive connected successfully' };
  }

  @Get('status')
  async status(@GetUser() user: User) {
    const status = await this.driveService.status(user.id);
    return { status };
  }

  @Get('folders')
  async listFolders(@GetUser() user: User) {
    const folders = await this.driveService.listFolders(user.id);
    return { folders };
  }

  @Post('folder')
  async selectFolder(@GetUser() user: User, @Body() body: { folderId: string; folderName?: string }) {
    await this.driveService.selectFolder(user.id, body.folderId, body.folderName);
    return { message: 'Folder selected successfully' };
  }

  @Post('save')
  async save(@GetUser() user: User, @Body() body: { title: string; content: string; summary?: string; tags?: string }) {
    const url = await this.driveService.save(user.id, body);
    return { message: 'Saved to Google Drive successfully', url };
  }

  @Delete('disconnect')
  async disconnect(@GetUser() user: User) {
    await this.driveService.disconnect(user.id);
    return { message: 'Google Drive disconnected successfully' };
  }

  @Get('oauth/authorize')
  async getOAuthUrl(@GetUser() user: User) {
    if (process.env.NODE_ENV === 'development') {
      const frontend = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const mockAuthUrl = `${frontend}/auth/gdrive-mock?userId=${user.id}`;
      return { url: mockAuthUrl };
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${this.configService.get<string>('API_URL')}/drive/oauth/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/documents',
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: String(user.id),
      include_granted_scopes: true,
    });

    return { url };
  }
}