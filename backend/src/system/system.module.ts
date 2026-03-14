import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { CleanupService } from './cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [SystemController],
  providers: [SystemService, CleanupService]
})
export class SystemModule {}
