import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async getChannels(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return [];
    
    return this.prisma.channelIntegration.findMany({
        where: { businessId: business.id }
    });
  }

  async getICals(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return [];
    
    return this.prisma.iCalIntegration.findMany({
        where: { businessId: business.id }
    });
  }

  async getSyncLogs(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return [];
    
    return this.prisma.syncLog.findMany({
        where: { businessId: business.id },
        orderBy: { timestamp: 'desc' },
        take: 50
    });
  }

  async addChannel(userId: string, data: any) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new NotFoundException('Business not found');

    return this.prisma.channelIntegration.create({
        data: {
            businessId: business.id,
            name: data.name,
            type: data.type,
            status: 'CONNECTED',
            config: data.config
        }
    });
  }
}
