import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminFinancialLogsService } from './admin-financial-logs.service';

@Controller('admin/wallet/financial-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminFinancialLogsController {
  constructor(private readonly logs: AdminFinancialLogsService) {}

  @Get()
  async list(
    @Query('adminId') adminId?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('transactionId') transactionId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.logs.list(
      { adminId, targetUserId, transactionId },
      { skip: skip ? Number(skip) : undefined, take: take ? Number(take) : undefined }
    );
  }
}

