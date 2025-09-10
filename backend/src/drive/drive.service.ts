import { Injectable, BadRequestException, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../database/user.entity';
import * as CryptoJS from 'crypto-js';
import { google } from 'googleapis';

@Injectable()
export class DriveService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key';
  }

  // 使用内存态在开发阶段保存 Drive 连接与文件夹选择信息，避免修改数据库 schema
  private driveState = new Map<number, { accessToken?: string; folderId?: string; folderName?: string }>();
  private readonly encryptionKey: string;

  private encryptToken(token: string): string {
    return CryptoJS.AES.encrypt(token, this.encryptionKey).toString();
  }

  private decryptToken(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // 获取已授权用户的 OAuth2 客户端（生产环境使用）
  private async getOAuthClient(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.driveAccessToken) {
      throw new BadRequestException('Google Drive not connected');
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${this.configService.get<string>('API_URL')}/drive/oauth/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    try {
      const accessToken = this.decryptToken(user.driveAccessToken);
      const creds: any = { access_token: accessToken };
      if (user.driveRefreshToken) {
        creds.refresh_token = this.decryptToken(user.driveRefreshToken);
      }
      if (user.driveTokenExpiry) {
        creds.expiry_date = new Date(user.driveTokenExpiry).getTime();
      }
      oauth2Client.setCredentials(creds);
    } catch (err) {
      throw new InternalServerErrorException('Failed to decrypt Google Drive tokens');
    }

    return oauth2Client;
  }

  async connect(userId: number, accessToken: string, refreshToken?: string, folderId?: string, folderName?: string) {
     if (process.env.NODE_ENV === 'development') {
       // 开发模式下：仅写入内存态
       this.driveState.set(userId, {
         accessToken,
         folderId,
         folderName,
       });
       return;
     }

    // 生产模式：加密并持久化到数据库
    try {
      const encryptedAccess = this.encryptToken(accessToken);
      const updatePayload: Partial<User> = {
        driveAccessToken: encryptedAccess,
      };
      if (refreshToken) {
        updatePayload.driveRefreshToken = this.encryptToken(refreshToken);
      }
      if (folderId) {
        updatePayload.driveFolderId = folderId;
      }
      if (folderName) {
        updatePayload.driveFolderName = folderName;
      }
      // 将过期时间设置为 55 分钟后（若真实值未知），后续由 googleapis 自动刷新
      const now = Date.now();
      updatePayload.driveTokenExpiry = new Date(now + 55 * 60 * 1000);

      await this.userRepository.update(userId, updatePayload);
    } catch (err) {
      throw new InternalServerErrorException('Failed to save Google Drive credentials');
    }
  }

  async status(userId: number) {
     if (process.env.NODE_ENV === 'development') {
       const state = this.driveState.get(userId);
       const connected = Boolean(state?.accessToken);
       return {
         connected,
         folderSelected: Boolean(state?.folderId),
         folderName: state?.folderName || undefined,
       };
     }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const connected = Boolean(user?.driveAccessToken);
    return {
      connected,
      folderSelected: Boolean(user?.driveFolderId),
      folderName: user?.driveFolderName || undefined,
    };
  }

  async listFolders(userId: number) {
    // 开发模式 mock 列表
    if (process.env.NODE_ENV === 'development') {
      return [
        { id: 'mock_drive_folder_1', name: 'AI ThreadStash Exports' },
        { id: 'mock_drive_folder_2', name: 'Notes' },
        { id: 'mock_drive_folder_3', name: 'Projects' },
      ];
    }

    try {
      const auth = await this.getOAuthClient(userId);
      const drive = google.drive({ version: 'v3', auth });
      const res = await drive.files.list({
        q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, name)',
        pageSize: 100,
        spaces: 'drive',
      });

      const folders = (res.data.files || []).map((f) => ({ id: f.id!, name: f.name! }));
      return folders;
    } catch (err) {
      throw new InternalServerErrorException('Failed to list Google Drive folders');
    }
  }

  async selectFolder(userId: number, folderId: string, folderName?: string) {
     if (process.env.NODE_ENV === 'development') {
       const prev = this.driveState.get(userId) || {};
       this.driveState.set(userId, {
         ...prev,
         folderId,
         folderName,
       });
       return;
     }

    await this.userRepository.update(userId, { driveFolderId: folderId, driveFolderName: folderName });
  }

  async disconnect(userId: number) {
     if (process.env.NODE_ENV === 'development') {
       // 清理内存态
       this.driveState.delete(userId);
       return;
     }

    await this.userRepository.update(userId, {
      driveAccessToken: null,
      driveRefreshToken: null,
      driveTokenExpiry: null,
      driveFolderId: null,
      driveFolderName: null,
    });
  }

  async save(userId: number, data: { title: string; content: string; summary?: string; tags?: string }): Promise<string> {
     const state = this.driveState.get(userId);
 
     if (process.env.NODE_ENV === 'development') {
       // 开发模式：需要至少选择文件夹
       if (!state?.accessToken) {
         throw new BadRequestException('Google Drive not connected');
       }
       if (!state?.folderId) {
         throw new BadRequestException('Please select a folder first');
       }

       const slug = encodeURIComponent(data.title.toLowerCase().replace(/\s+/g, '-'));
       const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
       return `${frontendUrl}/gdocs/${slug}`;
     }

    // 生产模式：使用 Google Docs API 创建文档并写入内容
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || !user.driveAccessToken) {
        throw new BadRequestException('Google Drive not connected');
      }
      if (!user.driveFolderId) {
        throw new BadRequestException('Please select a folder first');
      }

      const auth = await this.getOAuthClient(userId);
      const docs = google.docs({ version: 'v1', auth });

      // 1) 创建文档（标题）
      const createRes = await docs.documents.create({
        requestBody: { title: data.title },
      });
      const documentId = createRes.data.documentId!;

      // 2) 将文档移动到选定的文件夹（需要通过 Drive API 更新父级）
      const drive = google.drive({ version: 'v3', auth });
      await drive.files.update({
        fileId: documentId,
        addParents: user.driveFolderId!,
        fields: 'id, parents',
      });

      // 3) 写入内容（标题、正文、可选 Summary 与 Tags）
      const chunks: string[] = [];
      chunks.push(data.content || '');
      if (data.summary) {
        chunks.push('\n\nSummary\n' + data.summary);
      }
      if (data.tags) {
        chunks.push('\n\nTags: ' + data.tags);
      }
      const contentText = chunks.join('');

      if (contentText.trim().length > 0) {
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  text: contentText,
                  endOfSegmentLocation: {},
                },
              },
            ],
          },
        });
      }

      const url = `https://docs.google.com/document/d/${documentId}/edit`;
      return url;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to save to Google Drive');
    }
  }
}