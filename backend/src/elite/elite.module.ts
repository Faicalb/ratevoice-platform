import { Module } from '@nestjs/common';
import { EliteController } from './elite.controller';
import { EliteService } from './elite.service';

@Module({
  controllers: [EliteController],
  providers: [EliteService]
})
export class EliteModule {}
