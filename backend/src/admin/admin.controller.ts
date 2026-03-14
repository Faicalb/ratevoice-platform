import { Controller, Get, Param, Patch, Delete, Body, Post, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN') // Secure all admin routes
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  // --- USERS ---
  // @UseGuards(JwtAuthGuard, RolesGuard) // Temporarily disabled for testing
  // @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('users/create')
  async createUser(@Body() data: any) {
    return this.adminService.createUser(data);
  }

  @Get('users')
  async getAllUsers(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.adminService.getAllUsers(Number(skip || 0), Number(take || 50));
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/ban')
  async banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }

  // --- BUSINESSES ---
  @Get('businesses')
  async getAllBusinesses(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.adminService.getAllBusinesses(Number(skip || 0), Number(take || 50));
  }

  @Patch('businesses/:id/status')
  async updateBusinessStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateBusinessStatus(id, status);
  }

  // --- REVIEWS ---
  @Get('reviews')
  async getAllReviews(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.adminService.getAllReviews(Number(skip || 0), Number(take || 50));
  }

  @Delete('reviews/:id')
  async deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  // --- POINTS ---
  @Post('users/:id/reward')
  async rewardUser(@Param('id') id: string, @Body() body: { amount: number; reason: string }) {
    return this.adminService.rewardUser(id, body.amount, body.reason);
  }
}
