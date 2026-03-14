import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @Roles('BUSINESS', 'ADMIN')
  async getMyStories(@Req() req) {
    return this.storiesService.getBusinessStories(req.user.id);
  }

  @Post()
  @Roles('BUSINESS')
  async createStory(@Req() req, @Body() data: any) {
    return this.storiesService.createStory(req.user.id, data);
  }

  @Delete(':id')
  @Roles('BUSINESS')
  async deleteStory(@Param('id') id: string) {
    return this.storiesService.deleteStory(id);
  }

  @Post(':id/boost')
  @Roles('BUSINESS')
  async boostStory(@Param('id') id: string, @Body() data: any) {
    return this.storiesService.boostStory(id, data);
  }
}
