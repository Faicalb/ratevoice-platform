import { Controller, Post, Body, UseGuards, Get, Query, Param, Request } from '@nestjs/common';
import { AdminBusinessService } from './admin-business.service';
import { AiOwnerEmailFinderService } from './ai-owner-email-finder.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/business')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class AdminBusinessController {
  constructor(
    private readonly adminBusinessService: AdminBusinessService,
    private readonly emailFinderService: AiOwnerEmailFinderService
  ) {}

  @Get('search-places')
  async searchPlaces(@Query('query') query: string) {
    return this.adminBusinessService.searchPlaces(query);
  }

  @Get('detect-duplicates')
  async detectDuplicates(
    @Query('name') name: string,
    @Query('lat') lat: number,
    @Query('lng') lng: number
  ) {
    return this.adminBusinessService.detectDuplicates(name, Number(lat), Number(lng));
  }

  @Post('create-manual')
  async createBusinessManual(@Request() req, @Body() data: any) {
    return this.adminBusinessService.createBusinessManual(req.user.id, data);
  }

  @Post('find-email/:id')
  async findOwnerEmail(@Param('id') id: string) {
    return this.emailFinderService.findOwnerEmail(id);
  }

  @Post('bulk-find-email')
  async bulkFindEmail() {
    return this.emailFinderService.findEmailsForUnclaimedBusinesses();
  }
}
