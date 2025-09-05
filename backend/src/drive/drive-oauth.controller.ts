import { Controller, Get, Query, Res, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { DriveService } from './drive.service';

@Controller('drive')
export class DriveOAuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly driveService: DriveService,
  ) {}

  @Get('oauth/callback')
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const userId = parseInt(state, 10);
    if (!code || !state || isNaN(userId)) {
      throw new BadRequestException('Invalid OAuth callback parameters');
    }

    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const redirectUri = `${this.configService.get<string>('API_URL')}/drive/oauth/callback`;

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      const { tokens } = await oauth2Client.getToken(code);

      const accessToken = tokens.access_token;
      const refreshToken = tokens.refresh_token;

      if (!accessToken) {
        throw new InternalServerErrorException('No access token received from Google');
      }

      // Persist tokens (DriveService handles encryption & saving in production)
      await this.driveService.connect(userId, accessToken, refreshToken || undefined);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const targetOrigin = new URL(frontendUrl).origin;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Google Drive Connected</title>
</head>
<body>
  <script>
    (function(){
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'GDRIVE_AUTH_SUCCESS' }, '${targetOrigin}');
        }
      } catch (e) { /* ignore */ }
      window.close();
    })();
  </script>
  <p>Google Drive authorization successful. You can close this window.</p>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (err) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const targetOrigin = new URL(frontendUrl).origin;
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Google Drive Authorization Failed</title>
</head>
<body>
  <script>
    (function(){
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'GDRIVE_AUTH_CANCELLED', error: 'Authorization failed' }, '${targetOrigin}');
        }
      } catch (e) { /* ignore */ }
      window.close();
    })();
  </script>
  <p>Google Drive authorization failed. You can close this window.</p>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }
  }
}