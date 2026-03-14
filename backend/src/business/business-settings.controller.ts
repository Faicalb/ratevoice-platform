import { Body, Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BusinessSettingsService } from './business-settings.service';

@Controller('business/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
export class BusinessSettingsController {
  constructor(private readonly settings: BusinessSettingsService) {}

  @Get()
  async getAll(@Request() req) {
    return this.settings.getSettings(req.user.id);
  }

  @Patch(':section')
  async update(@Request() req, @Param('section') section: string, @Body() body: any) {
    return this.settings.updateSettings(req.user.id, section, body);
  }
}

