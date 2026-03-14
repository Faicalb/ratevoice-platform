import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('business/dashboard')
  @Roles('BUSINESS', 'ADMIN')
  @UseGuards(RolesGuard)
  async getBusinessDashboardStats(@Request() req) {
    return this.analyticsService.getBusinessDashboardStats(req.user.id);
  }

  @Get('business/trends')
  @Roles('BUSINESS', 'ADMIN')
  @UseGuards(RolesGuard)
  async getBusinessTrends(@Request() req) {
    return this.analyticsService.getBusinessTrends(req.user.id);
  }

  @Get('business/summary')
  @Roles('BUSINESS', 'ADMIN')
  @UseGuards(RolesGuard)
  async getBusinessSummary(@Request() req) {
    return this.analyticsService.getBusinessAnalyticsSummary(req.user.id);
  }

  @Get('admin/visitors')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getVisitorStats() {
    return this.analyticsService.getVisitorStats();
  }

  @Get('admin/dashboard')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAdminStats() {
    return this.analyticsService.getAdminStats();
  }
}
