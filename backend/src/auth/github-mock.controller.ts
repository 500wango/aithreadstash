import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class GitHubMockController {
  constructor(private readonly authService: AuthService) {}

  @Post('github-mock')
  async githubMockAuth(
    @Body() body: { username: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const { username, password } = body;

      // 简单验证
      if (!username || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: '请输入用户名和密码',
        });
      }

      // 模拟GitHub用户数据
      const mockUser = {
        id: `github-${username}`,
        email: `${username}@github.mock`,
        username: username,
        name: username,
        avatar_url: `https://github.com/${username}.png`,
      };

      // 创建或查找用户并生成token
      const result = await this.authService.findOrCreateGitHubUser(mockUser);

      return res.status(HttpStatus.OK).json({
        success: true,
        token: result.accessToken,
      });
    } catch (error) {
      console.error('GitHub mock auth error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: '登录失败，请重试',
      });
    }
  }
}