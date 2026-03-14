import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/stories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminStoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  async getAllStories() {
    return this.storiesService.getAllStories();
  }

  @Get('ads')
  async getAllAds() {
    return this.storiesService.getAllAds();
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.storiesService.updateStatus(id, status);
  }
}
