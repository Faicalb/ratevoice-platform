import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminWalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions')
  async getAllTransactions(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string
  ) {
    return this.walletService.getAllTransactions({ status, type, userId });
  }

  @Get('stats')
  async getWalletStats() {
    return this.walletService.getAdminStats();
  }

  @Patch('transactions/:id/approve')
  async approveWithdrawal(
    @Param('id') id: string,
    @Request() req
  ) {
    return this.walletService.approveWithdrawal(id, req.user.id);
  }

  @Patch('transactions/:id/reject')
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req
  ) {
    return this.walletService.rejectWithdrawal(id, reason, req.user.id);
  }

  @Patch('transactions/:id/flag')
  async flagTransaction(@Param('id') id: string) {
    return this.walletService.flagTransaction(id);
  }

  @Post('adjust-balance')
  async adjustBalance(
    @Body('userId') userId: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
    @Request() req
  ) {
    return this.walletService.adminAdjustBalance(userId, amount, reason, req.user.id);
  }

  @Post('transfer')
  async adminTransfer(
    @Body('fromUserId') fromUserId: string,
    @Body('toUserId') toUserId: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
    @Request() req
  ) {
    return this.walletService.adminTransfer(fromUserId, toUserId, amount, reason, req.user.id);
  }
}
