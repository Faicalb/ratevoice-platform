import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AiAnalyticsService } from './ai-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyzeReviewDto } from './dto/analyze-review.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('ai-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiAnalyticsController {
  constructor(private readonly aiAnalyticsService: AiAnalyticsService) { }

  @Post('analyze-review')
  async analyzeReview(@Body() dto: AnalyzeReviewDto) {
    return this.aiAnalyticsService.analyzeReview(dto);
  }

  @Get('insights')
  async getInsights() {
    return this.aiAnalyticsService.getInsights();
  }

  @Get('data-wall')
  async getDataWall() {
    return this.aiAnalyticsService.getDataWall();
  }

  @Get('comment-analysis')
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async commentAnalysis(@Request() req) {
    return this.aiAnalyticsService.getCommentAnalysis(req.user.id);
  }

  @Get('competitor-benchmark')
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async competitorBenchmark() {
    return this.aiAnalyticsService.getCompetitorBenchmarking();
  }

  @Post('ask')
  async askCommand(@Body('query') query: string) {
    return this.aiAnalyticsService.askAI(query);
  }
}
