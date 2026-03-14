import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { GlobalDataEngineService } from './global-data-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/global-data')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class GlobalDataEngineController {
  constructor(private readonly engineService: GlobalDataEngineService) {}

  @Post('discover')
  async discoverBusinesses(@Body() data: { city: string; country: string; type: string; limit?: number }) {
    return this.engineService.discoverBusinesses(data.city, data.country, data.type, data.limit);
  }

  @Post('import')
  async importBusinesses(@Body() data: { businesses: any[] }) {
    return this.engineService.importBusinesses(data.businesses);
  }
}
