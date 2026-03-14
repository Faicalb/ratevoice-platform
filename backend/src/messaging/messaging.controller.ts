import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.messagingService.getConversations(req.user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(@Request() req, @Param('id') id: string) {
    return this.messagingService.getMessages(id, req.user.id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(@Request() req, @Param('id') id: string, @Body('content') content: string) {
    return this.messagingService.sendMessage(req.user.id, id, content);
  }
}
