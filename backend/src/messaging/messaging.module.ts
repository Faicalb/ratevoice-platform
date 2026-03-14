import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { AdminChatController } from './admin-chat.controller';
import { MessagingService } from './messaging.service';

@Module({
  controllers: [MessagingController, AdminChatController],
  providers: [MessagingService]
})
export class MessagingModule {}
