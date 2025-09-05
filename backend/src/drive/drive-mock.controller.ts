import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { DriveService } from './drive.service';

@Controller('drive')
export class DriveMockController {
  constructor(private readonly driveService: DriveService) {}

  @Post('mock-connect')
  async mockConnect(@Body() body: { userId: number; folderName?: string }) {
    const { userId, folderName } = body;

    if (userId === undefined || userId === null) {
      throw new BadRequestException('Missing userId');
    }

    // Ensure userId is a number at runtime to avoid Map key type mismatch
    const uid = Number(userId);
    if (Number.isNaN(uid)) {
      throw new BadRequestException('Invalid userId');
    }

    try {
      const mockAccessToken = `mock_drive_token_${Date.now()}_${uid}`;
      const mockFolderId = `mock_drive_folder_${uid}`;
      const mockFolderName = folderName || 'AI ThreadStash Exports';

      await this.driveService.connect(uid, mockAccessToken, undefined, mockFolderId, mockFolderName);

      return {
        success: true,
        message: 'Google Drive connected successfully (mock)',
        folderName: mockFolderName,
        folderId: mockFolderId,
      };
    } catch (error) {
      throw new BadRequestException('Failed to connect to Google Drive (mock)');
    }
  }
}