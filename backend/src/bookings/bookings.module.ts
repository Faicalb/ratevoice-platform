import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { AdminBookingsController } from './admin-bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService],
  exports: [BookingsService]
})
export class BookingsModule {}
