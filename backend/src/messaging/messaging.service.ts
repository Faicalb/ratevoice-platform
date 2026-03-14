import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, getPagination } from '../common/dto/pagination.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: { user: { select: { fullName: true, avatarUrl: true } } }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getMessages(conversationId: string, userId: string) {
    // Verify participation
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content
      }
    });
  }

  async startConversation(userId: string, participantId: string) {
    // Check if exists
    // Simplified logic: create new for now
    return this.prisma.conversation.create({
        data: {
            participants: {
                create: [
                    { userId },
                    { userId: participantId }
                ]
            }
        }
    });
  }

  // Admin Methods
  async getAllConversations(pagination?: PaginationDto) {
    const { skip, take } = getPagination(pagination || {});
    return this.prisma.conversation.findMany({
      skip,
      take,
      include: {
        participants: {
          include: { user: { select: { fullName: true, email: true } } }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getAdminMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true, email: true } }
      }
    });
  }

  async getMessage(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
      include: { sender: true }
    });
  }

  async deleteMessage(id: string) {
    const msg = await this.prisma.message.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    return this.prisma.message.delete({ where: { id } });
  }

  async blockUser(userId: string) {
    // This logic might belong in UserService but for now we update User status
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });
  }
}
