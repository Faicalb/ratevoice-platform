import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('business/integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('channels')
  @Roles('BUSINESS', 'ADMIN')
  @UseGuards(RolesGuard)
  async getChannels(@Request() req) {
    return this.integrationsService.getChannels(req.user.id);
  }

  @Get('icals')
  @Roles('BUSINESS', 'ADMIN')
  @UseGuards(RolesGuard)
  async getICals(@Request() req) {
    return this.integrationsService.getICals(req.user.id);
  }

  @Get('logs')
  @Roles('BUSINESS', 'ADMIN')
  @UseGuards(RolesGuard)
  async getSyncLogs(@Request() req) {
    return this.integrationsService.getSyncLogs(req.user.id);
  }
}
