import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CompetitorsService } from './competitors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('competitors')
export class CompetitorsController {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @UseGuards(RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async getCompetitors(@Request() req) {
      return this.competitorsService.getCompetitors(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async addCompetitor(@Request() req, @Body() data: any) {
      return this.competitorsService.addCompetitor(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async deleteCompetitor(@Request() req, @Param('id') id: string) {
      return this.competitorsService.deleteCompetitor(req.user.id, id);
  }
}
