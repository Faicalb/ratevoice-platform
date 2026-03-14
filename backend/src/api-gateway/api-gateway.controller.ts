import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { AiOptimizationService } from './services/ai-optimization.service';
import { ApiSeederService } from './services/api-seeder.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class ApiGatewayController {
  constructor(
    private readonly apiGatewayService: ApiGatewayService,
    private readonly optimizationService: AiOptimizationService,
    private readonly seederService: ApiSeederService
  ) {}

  @Post('seed')
  async seedProviders() {
    return this.seederService.seedAllProviders();
  }

  @Get('dashboard')
  async getDashboard() {
    return this.apiGatewayService.getDashboardData();
  }

  @Get('optimize')
  async getOptimization() {
    return this.optimizationService.getRecommendations();
  }

  @Get()
  async getAllProviders() {
    return this.apiGatewayService.getAllProviders();
  }

  @Post()
  async createProvider(@Body() dto: CreateProviderDto) {
    try {
      return await this.apiGatewayService.createProvider(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id')
  async updateProvider(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.apiGatewayService.updateProvider(id, dto);
  }

  @Delete(':id')
  async deleteProvider(@Param('id') id: string) {
    return this.apiGatewayService.deleteProvider(id);
  }

  @Post('test/:id')
  async testProvider(@Param('id') id: string) {
    return this.apiGatewayService.testProvider(id);
  }
}
