import { Body, Controller, Get, Post, Put, Request, UseGuards, Param, ParseUUIDPipe, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  @Get('dashboard-stats')
  async getDashboardStats(@Request() req) {
    return this.businessService.getDashboardStats(req.user.id);
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('business_license_upload'))
  async registerBusiness(@Body() body: any, @UploadedFile() file?: any) {
    return this.businessService.registerBusiness(body, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  @Get('verification-status')
  async getVerificationStatus(@Request() req) {
    return this.businessService.getVerificationStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  @Get('profile')
  async getBusinessProfile(@Request() req) {
    return this.businessService.getBusinessProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  @Put('profile')
  async updateBusinessProfile(@Request() req, @Body() data: any) {
    return this.businessService.updateBusinessProfile(req.user.id, data);
  }

  @Get(':id')
  async getBusinessById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.businessService.getBusinessById(id);
  }
}
