import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SecurityService } from './security.service';

@Controller('admin/security-alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminSecurityAlertsController {
  constructor(private readonly security: SecurityService) {}

  @Get()
  async list(@Query('take') take?: string) {
    return this.security.listAlerts(Number(take || 200));
  }

  @Post('refresh')
  async refresh() {
    return this.security.refreshAlerts();
  }

  @Patch(':id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: 'NEW' | 'INVESTIGATING' | 'RESOLVED') {
    return this.security.updateAlertStatus(req.user.id, id, status);
  }
}

