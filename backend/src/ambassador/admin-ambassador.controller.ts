import { Controller, Get, Post, Body, Param, UseGuards, Put } from '@nestjs/common';
import { AmbassadorService } from './ambassador.service';
import { CreateAmbassadorDto } from './dto/create-ambassador.dto';
import { AddBalanceDto, ApproveWithdrawalDto, RequestWithdrawalDto } from './dto/wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/ambassadors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminAmbassadorController {
  constructor(private readonly ambassadorService: AmbassadorService) {}

  @Post('create')
  async createAmbassador(@Body() dto: CreateAmbassadorDto) {
    return this.ambassadorService.createManualAmbassador(dto);
  }

  @Get()
  async getAllAmbassadors() {
    return this.ambassadorService.getAllAmbassadors();
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ambassadorService.updateStatus(id, status);
  }

  @Get(':id/wallet')
  async getWallet(@Param('id') id: string) {
    return this.ambassadorService.getWallet(id);
  }

  @Post(':id/add-balance')
  async addBalance(@Param('id') id: string, @Body() dto: AddBalanceDto) {
    return this.ambassadorService.addBalance(id, dto);
  }

  @Post(':id/request-withdraw')
  async requestWithdrawal(@Param('id') id: string, @Body() dto: RequestWithdrawalDto) {
    return this.ambassadorService.requestWithdrawal(id, dto);
  }

  @Post(':id/approve-withdraw/:requestId')
  async approveWithdrawal(
    @Param('id') id: string, 
    @Param('requestId') requestId: string,
    @Body() dto: ApproveWithdrawalDto
  ) {
    // In a real app, get adminId from request user
    const adminId = 'system-admin'; 
    return this.ambassadorService.approveWithdrawal(id, requestId, dto, adminId);
  }

  @Post(':id/reject-withdraw/:requestId')
  async rejectWithdrawal(
    @Param('id') id: string, 
    @Param('requestId') requestId: string,
    @Body('reason') reason: string
  ) {
    const adminId = 'system-admin';
    return this.ambassadorService.rejectWithdrawal(id, requestId, reason, adminId);
  }

  @Get(':id/withdrawals')
  async getWithdrawals(@Param('id') id: string) {
    return this.ambassadorService.getWithdrawals(id);
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    return this.ambassadorService.getLogs(id);
  }

  @Get('analytics/overview')
  async getAnalytics() {
    return this.ambassadorService.getAnalytics();
  }
}
