import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentSettingsService, PaymentProviderKey } from './payment-settings.service';

@Controller('admin/wallet/payment-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminPaymentSettingsController {
  constructor(private readonly paymentSettings: PaymentSettingsService) {}

  @Get()
  async getAll() {
    return this.paymentSettings.getAllAdmin();
  }

  @Put()
  async upsertMany(
    @Body()
    body: Array<{
      provider: PaymentProviderKey;
      enabled: boolean;
      priority: number;
      config: Record<string, any>;
    }>
  ) {
    if (!Array.isArray(body)) return [];
    let count = 0;
    for (const row of body) {
      await this.paymentSettings.upsertAdmin(row);
      count += 1;
    }
    return { success: true, count };
  }
}
