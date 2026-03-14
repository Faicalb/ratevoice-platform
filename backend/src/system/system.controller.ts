import { Body, Controller, Get, Patch, Param, Query, Request, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('overview')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getOverview() {
    return this.systemService.getOverviewStats();
  }

  @Get('health')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getHealth() {
    return this.systemService.getSystemHealth();
  }

  @Get('users')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getUsers(@Query('page') page: string, @Query('limit') limit: string) {
      return this.systemService.getUsers(Number(page) || 1, Number(limit) || 10);
  }

  @Get('businesses')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getBusinesses(@Query('page') page: string, @Query('limit') limit: string) {
      return this.systemService.getBusinesses(Number(page) || 1, Number(limit) || 10);
  }

  @Get('features')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getFeatures() {
    return this.systemService.getFeatures();
  }

  @Patch('features/:key')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateFeature(@Request() req, @Param('key') key: string, @Body() body: any) {
    return this.systemService.updateFeature(req.user.id, key, body);
  }

  @Get('ai-settings')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAiSettings() {
    return this.systemService.getAiSettings();
  }

  @Patch('ai-settings')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateAiSettings(@Request() req, @Body() body: any) {
    return this.systemService.updateAiSettings(req.user.id, body);
  }
}
