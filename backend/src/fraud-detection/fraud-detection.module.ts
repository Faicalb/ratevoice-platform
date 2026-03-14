import { Module } from '@nestjs/common';
import { FraudDetectionService } from './fraud-detection.service';
import { FraudBehaviorService } from './fraud-behavior.service';
import { FraudAnomalyService } from './fraud-anomaly.service';
import { FraudDetectionController } from './fraud-detection.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FraudDetectionController],
  providers: [FraudDetectionService, FraudBehaviorService, FraudAnomalyService],
  exports: [FraudDetectionService]
})
export class FraudDetectionModule {}