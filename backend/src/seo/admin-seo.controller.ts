import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SeoService } from './seo.service';
import { GlobalSeoService } from '../seo-intelligence/services/global-seo.service';
import { SeoPageGeneratorService } from '../seo-intelligence/services/seo-page-generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/seo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminSeoController {
  constructor(
    private readonly seoService: SeoService,
    private readonly globalSeo: GlobalSeoService,
    private readonly pageGen: SeoPageGeneratorService
  ) {}

  @Get('business')
  async getAllBusinessSeo() {
    return this.seoService.getAllBusinessSeo();
  }

  @Get('business/:id')
  async getBusinessSeo(@Param('id') id: string) {
    return this.seoService.getBusinessSeoById(id);
  }

  @Patch('business/:id')
  async updateBusinessSeo(@Param('id') id: string, @Body() data: any, @Req() req) {
    return this.seoService.updateAdminSeo(id, 'UPDATE', data, req.user.id);
  }

  @Post('business/:id/approve')
  async approveSeo(@Param('id') id: string, @Req() req) {
    return this.seoService.updateAdminSeo(id, 'APPROVE', undefined, req.user.id);
  }

  @Post('business/:id/reject')
  async rejectSeo(@Param('id') id: string, @Req() req) {
    return this.seoService.updateAdminSeo(id, 'REJECT', undefined, req.user.id);
  }

  @Post('business/:id/lock')
  async lockSeo(@Param('id') id: string, @Req() req) {
    return this.seoService.updateAdminSeo(id, 'LOCK', undefined, req.user.id);
  }

  @Post('business/:id/unlock')
  async unlockSeo(@Param('id') id: string, @Req() req) {
    return this.seoService.updateAdminSeo(id, 'UNLOCK', undefined, req.user.id);
  }

  @Get('global')
  async getGlobalSettings() {
    return this.globalSeo.getSettings();
  }

  @Patch('global')
  async updateGlobalSettings(@Body() data: any) {
    return this.globalSeo.updateSettings(data);
  }

  @Post('global/generate-page')
  async generatePage(@Body() body: { city: string, category: string }) {
    return this.pageGen.generateCityPage(body.city, body.category);
  }

  @Get('global/pages')
  async getPages() {
    return this.pageGen.getAllPages();
  }
}
