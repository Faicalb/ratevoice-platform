import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { FraudDetectionService } from './fraud-detection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/fraud-detection')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class FraudDetectionController {
  constructor(private readonly fraudService: FraudDetectionService) {}

  @Post('analyze/:ambassadorId')
  async triggerAnalysis(@Param('ambassadorId') ambassadorId: string) {
    return this.fraudService.analyzeAmbassador(ambassadorId);
  }

  @Get('events')
  async getFraudEvents() {
    return this.fraudService.getFraudEvents();
  }

  @Get('high-risk')
  async getHighRiskAmbassadors() {
    return this.fraudService.getHighRiskAmbassadors();
  }
}
