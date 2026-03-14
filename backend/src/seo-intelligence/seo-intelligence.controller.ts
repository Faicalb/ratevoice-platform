import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { SeoIntelligenceService } from './seo-intelligence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('seo/intelligence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeoIntelligenceController {
  constructor(private service: SeoIntelligenceService) {}

  @Get('dashboard')
  @Roles('BUSINESS', 'ADMIN')
  async getDashboard(@Req() req) {
    return this.service.getDashboardData(req.user.id);
  }

  @Post('audit')
  @Roles('BUSINESS', 'ADMIN')
  async runAudit(@Req() req) {
    return this.service.runAudit(req.user.id);
  }

  @Post('content')
  @Roles('BUSINESS', 'ADMIN')
  async generateContent(@Req() req) {
    return this.service.generateContent(req.user.id);
  }
}
