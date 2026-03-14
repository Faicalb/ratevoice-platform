import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AdsAiService } from './ads-ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/ads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminAdsController {
  constructor(
    private adsService: AdsService,
    private aiService: AdsAiService
  ) {}

  @Get('stats')
  async getDashboardStats() {
    return this.adsService.getDashboardStats();
  }

  @Post()
  async createAd(@Body() data: any) {
    return this.adsService.createAd(data);
  }

  @Get()
  async getAds() {
    return this.adsService.getAllAds();
  }

  @Patch(':id/pause')
  async pauseAd(@Param('id') id: string) {
    return this.adsService.updateStatus(id, 'PAUSED');
  }

  @Patch(':id/resume')
  async resumeAd(@Param('id') id: string) {
    return this.adsService.updateStatus(id, 'ACTIVE');
  }

  @Delete(':id')
  async deleteAd(@Param('id') id: string) {
    return this.adsService.deleteAd(id);
  }

  @Get(':id/analytics')
  async getAnalytics(@Param('id') id: string) {
    return this.adsService.getAdAnalytics(id);
  }

  @Post(':id/optimize')
  async optimizeAd(@Param('id') id: string) {
    const targeting = await this.aiService.suggestBestTarget(id);
    const placement = await this.aiService.predictBestPlacement(id);
    const budget = await this.aiService.autoBudgetOptimization(id);
    const fraud = await this.aiService.fraudDetection(id);
    
    return {
      targeting,
      placement,
      budget,
      fraud
    };
  }
}
