import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SeoService } from './seo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('business/seo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get()
  async getMySeo(@Req() req) {
    return this.seoService.getBusinessSeo(req.user.id);
  }

  @Patch('update')
  async updateMySeo(@Req() req, @Body() data: any) {
    return this.seoService.updateBusinessSeo(req.user.id, data);
  }

  @Post('analyze')
  async analyzeSeo(@Req() req) {
    return this.seoService.analyzeSeo(req.user.id);
  }

  @Post('optimize')
  async optimizeSeo(@Req() req) {
    return this.seoService.autoOptimize(req.user.id);
  }
}
