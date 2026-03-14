import { Module } from '@nestjs/common';
import { SystemHealthController } from './system-health.controller';
import { SystemHealthService } from './system-health.service';
import { SystemHealthAIService } from './system-health.ai.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemHealthController],
  providers: [SystemHealthService, SystemHealthAIService],
  exports: [SystemHealthService]
})
export class SystemHealthModule {}