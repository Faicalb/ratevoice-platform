import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [PaymentController],
})
export class PaymentModule {}
