import { Module } from '@nestjs/common';
import { CompetitorsController } from './competitors.controller';
import { AdminCompetitorsController } from './admin-competitors.controller';
import { CompetitorsService } from './competitors.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompetitorsController, AdminCompetitorsController],
  providers: [CompetitorsService]
})
export class CompetitorsModule {}
