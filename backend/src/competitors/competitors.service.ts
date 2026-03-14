import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompetitorsService {
  constructor(private prisma: PrismaService) {}

  async getCompetitors(userId: string) {
    const business = await this.prisma.business.findFirst({
        where: { ownerId: userId }
    });

    if (!business) {
        return [];
    }

    return this.prisma.competitor.findMany({
        where: { businessId: business.id },
        orderBy: { trackedSince: 'desc' }
    });
  }

  async addCompetitor(userId: string, data: any) {
    const business = await this.prisma.business.findFirst({
        where: { ownerId: userId }
    });

    if (!business) {
        throw new NotFoundException('Business not found');
    }

    return this.prisma.competitor.create({
        data: {
            name: data.name,
            website: data.website,
            businessId: business.id
        }
    });
  }

  async deleteCompetitor(userId: string, id: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new NotFoundException('Business not found');
    const competitor = await this.prisma.competitor.findUnique({ where: { id } });
    if (!competitor || competitor.businessId !== business.id) throw new NotFoundException('Competitor not found');
    await this.prisma.competitor.delete({ where: { id } });
    await this.prisma.auditLog.create({ data: { userId, action: 'COMPETITOR_DELETE', resource: 'COMPETITOR', details: { competitorId: id } } });
    return { success: true };
  }
}
