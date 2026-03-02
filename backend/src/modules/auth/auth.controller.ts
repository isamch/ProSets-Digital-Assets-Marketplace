import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  @Public()
  @Get('health')
  healthCheck() {
    return { status: 'Auth service is running' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@CurrentUser() user: User) {
    return user;
  }
}