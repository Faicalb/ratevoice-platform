import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SecurityService } from './security.service';

@Controller('admin/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class SecurityController {
  constructor(private readonly security: SecurityService) {}

  @Get('alerts')
  async listAlerts(@Query('take') take?: string) {
    return this.security.listAlerts(Number(take || 200));
  }

  @Post('alerts/refresh')
  async refresh() {
    return this.security.refreshAlerts();
  }

  @Patch('alerts/:id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: 'NEW' | 'INVESTIGATING' | 'RESOLVED') {
    return this.security.updateAlertStatus(req.user.id, id, status);
  }

  @Get('business-status')
  async businessStatus() {
    return this.security.getBusinessSecurityStatus();
  }

  @Post('business/:id/activate')
  async activate(@Request() req, @Param('id') id: string) {
    return this.security.setBusinessStatus(req.user.id, id, 'ACTIVE');
  }

  @Post('business/:id/suspend')
  async suspend(@Request() req, @Param('id') id: string) {
    return this.security.setBusinessStatus(req.user.id, id, 'SUSPENDED');
  }

  @Post('business/:id/revoke-certificate')
  async revoke(@Request() req, @Param('id') id: string) {
    await this.security.setBusinessStatus(req.user.id, id, 'SUSPENDED');
    await this.security.setBusinessVerificationStatus(req.user.id, id, 'REJECTED');
    return { success: true };
  }

  @Post('business/:id/generate-certificate')
  async generate(@Request() req, @Param('id') id: string) {
    await this.security.setBusinessVerificationStatus(req.user.id, id, 'APPROVED');
    return { success: true };
  }
}
