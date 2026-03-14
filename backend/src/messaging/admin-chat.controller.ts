import { Controller, Get, Delete, Post, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminChatController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('chats')
  async getAllConversations() {
    return this.messagingService.getAllConversations();
  }

  @Get('chats/:id')
  async getConversationMessages(@Param('id') id: string) {
    return this.messagingService.getAdminMessages(id);
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string) {
    return this.messagingService.deleteMessage(id);
  }

  @Post('messages/:id/block-user')
  async blockUser(@Param('id') messageId: string) {
    const message = await this.messagingService.getMessage(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.messagingService.blockUser(message.senderId);
    return { success: true, message: "User blocked successfully" };
  }
}
