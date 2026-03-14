import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@GetUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  updateProfile(@GetUser('id') userId: string, @Body() data: any) {
    return this.usersService.updateProfile(userId, data);
  }
}