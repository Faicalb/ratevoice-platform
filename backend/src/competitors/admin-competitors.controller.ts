import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/competitors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminCompetitorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.prisma.competitor.findMany({
      skip: Number(skip || 0),
      take: Number(take || 50),
      orderBy: { trackedSince: 'desc' },
      include: { business: { select: { id: true, name: true } } }
    });
  }

  @Patch(':id/visibility')
  async updateVisibility(@Param('id') id: string, @Body('visibility') visibility: 'visible' | 'hidden') {
    const isVisible = visibility === 'visible';
    return this.prisma.competitor.update({ where: { id }, data: { isVisible } });
  }

  @Patch(':id')
  async updateCompetitor(@Param('id') id: string, @Body() body: any) {
    return this.prisma.competitor.update({
      where: { id },
      data: {
        name: body.name,
        website: body.website,
        industry: body.industry,
        rating: body.rating,
        marketShare: body.marketShare,
        lastAnalysis: body.lastAnalysis ? new Date(body.lastAnalysis) : undefined
      }
    });
  }
}
