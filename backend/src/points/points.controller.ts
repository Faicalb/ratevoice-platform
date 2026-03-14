import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get()
  async getPoints(@Request() req) {
    return this.pointsService.getPoints(req.user.id);
  }

  @Get('rewards')
  async getRewards() {
    return this.pointsService.getRewards();
  }
}
