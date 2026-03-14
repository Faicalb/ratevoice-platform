import { Module } from '@nestjs/common';
import { AmbassadorController } from './ambassador.controller';
import { AdminAmbassadorController } from './admin-ambassador.controller';
import { AmbassadorService } from './ambassador.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [AmbassadorController, AdminAmbassadorController],
  providers: [AmbassadorService],
  exports: [AmbassadorService]
})
export class AmbassadorModule {}
