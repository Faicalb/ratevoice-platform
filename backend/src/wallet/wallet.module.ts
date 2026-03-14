import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { AdminWalletController } from './admin-wallet.controller';
import { AdminPaymentSettingsController } from './admin-payment-settings.controller';
import { AdminFinancialLogsController } from './admin-financial-logs.controller';
import { WalletService } from './wallet.service';
import { WalletTransactionService } from './wallet-transaction.service';
import { PaymentSettingsService } from './payment-settings.service';
import { AdminFinancialLogsService } from './admin-financial-logs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentGatewayService } from './payment-gateway/payment-gateway.service';
import { StripeProvider } from './payment-gateway/providers/stripe.provider';
import { PaypalProvider } from './payment-gateway/providers/paypal.provider';
import { CmiProvider } from './payment-gateway/providers/cmi.provider';
import { WebhooksController } from './payment-gateway/webhooks.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WalletController, AdminWalletController, AdminPaymentSettingsController, AdminFinancialLogsController, WebhooksController],
  providers: [
    WalletService,
    WalletTransactionService,
    PaymentSettingsService,
    AdminFinancialLogsService,
    PaymentGatewayService,
    StripeProvider,
    PaypalProvider,
    CmiProvider
  ],
  exports: [WalletService, WalletTransactionService, PaymentSettingsService, PaymentGatewayService]
})
export class WalletModule { }
