import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'ai-analysis' }
    ),
    NotificationsModule
  ],
  providers: [QueueService, NotificationsProcessor],
  exports: [QueueService]
})
export class QueueModule {}
