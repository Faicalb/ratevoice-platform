import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NewsService } from './news.service';
import { CreateEventDto, CreateNewsDto } from './dto/create-content.dto';

@Controller()
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('business/news-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async listForBusiness(@Query('city') city?: string, @Query('country') country?: string, @Query('type') type?: 'news' | 'event') {
    return this.newsService.listForBusiness({ city, country, type });
  }

  @Post('business/news-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async submit(@Request() req, @Body() body: any) {
    return this.newsService.businessCreate(req.user.id, body);
  }

  @Get('admin/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminListEvents(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.newsService.adminListEvents(Number(skip || 0), Number(take || 50));
  }

  @Post('admin/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminCreateEvent(@Request() req, @Body() dto: CreateEventDto) {
    return this.newsService.adminCreateEvent(req.user.id, dto);
  }

  @Patch('admin/events/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminUpdateEventStatus(@Request() req, @Param('id') id: string, @Body('status') status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
    return this.newsService.adminUpdateEventStatus(req.user.id, id, status);
  }

  @Delete('admin/events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminDeleteEvent(@Request() req, @Param('id') id: string) {
    return this.newsService.adminDeleteEvent(req.user.id, id);
  }

  @Get('admin/news')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminListNews(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.newsService.adminListNews(Number(skip || 0), Number(take || 50));
  }

  @Post('admin/news')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminCreateNews(@Request() req, @Body() dto: CreateNewsDto) {
    return this.newsService.adminCreateNews(req.user.id, dto);
  }

  @Patch('admin/news/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminUpdateNewsStatus(@Request() req, @Param('id') id: string, @Body('status') status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
    return this.newsService.adminUpdateNewsStatus(req.user.id, id, status);
  }

  @Delete('admin/news/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminDeleteNews(@Request() req, @Param('id') id: string) {
    return this.newsService.adminDeleteNews(req.user.id, id);
  }

  @Post('admin/news-events/refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async refresh(@Request() req) {
    return { success: true, sources: [] };
  }
}
