import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('campaigns')
  async getCampaigns(@Request() req) {
      return this.adsService.getCampaigns(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaigns')
  async createCampaign(@Request() req, @Body() data: any) {
      return this.adsService.createCampaign(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('campaigns/:id/ads')
  async getAds(@Param('id') campaignId: string) {
      return this.adsService.getAds(campaignId);
  }
}
