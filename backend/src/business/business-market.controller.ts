import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiIntegrationService } from '../api-integration/api-integration.service';

@Controller('business/market')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
export class BusinessMarketController {
  constructor(private readonly apiIntegration: ApiIntegrationService) {}

  @Get('search')
  async search(@Request() req, @Query('query') query: string) {
    const results = await this.apiIntegration.searchGooglePlaces(query);
    const items = results?.results || results || [];
    const count = Array.isArray(items) ? items.length : 0;
    const ratings = Array.isArray(items) ? items.map((i: any) => Number(i.rating || 0)).filter((n) => Number.isFinite(n) && n > 0) : [];
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const competitionLevel = count >= 20 ? 'High' : count >= 7 ? 'Medium' : 'Low';
    const demandLevel = avgRating >= 4.3 ? 'High' : avgRating >= 3.8 ? 'Medium' : 'Low';

    return {
      id: `MKT-${Date.now()}`,
      query,
      summary: `Search returned ${count} results with avg rating ${avgRating.toFixed(2)}.`,
      trend: 'stable',
      competitionLevel,
      demandLevel,
      dataPoints: [],
      recommendations: [],
      opportunities: [],
      heatmapData: [],
      competitionBreakdown: []
    };
  }
}

