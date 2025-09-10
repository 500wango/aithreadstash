import { Controller, Get, Patch, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../database/user.entity';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@GetUser() user: User) {
    const { password, ...profile } = user;
    return profile;
  }

  @Patch('profile')
  async updateProfile(@GetUser() user: User, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('password')
  async changePassword(@GetUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    const success = await this.usersService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );

    if (!success) {
      throw new BadRequestException('Current password is incorrect');
    }

    return { message: 'Password changed successfully' };
  }

  @Get('stats')
  async getUserStats(@GetUser() user: User) {
    return this.usersService.getUserStats(user.id);
  }

  @Get('activity')
  async getUserActivity(@GetUser() user: User) {
    return this.usersService.getUserActivity(user.id);
  }
}