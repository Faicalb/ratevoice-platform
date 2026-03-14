import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemHealthService } from './system-health.service';
import { SystemHealthAIService } from './system-health.ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/system-health')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class SystemHealthController {
  constructor(
    private readonly systemHealthService: SystemHealthService,
    private readonly systemHealthAIService: SystemHealthAIService
  ) {}

  @Get('overview')
  async getSystemOverview() {
    return this.systemHealthService.getSystemOverview();
  }

  @Get('api-performance')
  async getApiPerformance() {
    return this.systemHealthService.getApiPerformance();
  }

  @Get('errors')
  async getErrors() {
    return this.systemHealthService.getErrors();
  }

  @Get('security')
  async getSecurityThreats() {
    return this.systemHealthService.getSecurityThreats();
  }

  @Get('activity')
  async getUserActivity() {
    return this.systemHealthService.getUserActivity();
  }

  @Get('database')
  async getDatabaseHealth() {
    return this.systemHealthService.getDatabaseHealth();
  }

  @Get('ai-devops')
  async getAIDevOpsInsights() {
    return this.systemHealthAIService.analyzeSystem();
  }
}