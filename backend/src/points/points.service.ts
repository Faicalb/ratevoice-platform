import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async getPoints(userId: string) {
    const ledgers = await this.prisma.pointsLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });

    const total = ledgers.reduce((acc, curr) => acc + curr.points, 0);

    return { total, history: ledgers };
  }

  async getRewards() {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'rewards_catalog' } });
    if (!setting) return [];
    if (setting.type !== 'JSON') return [];
    try {
      const parsed = JSON.parse(setting.value);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({
          id: String((r as any).id || ''),
          name: String((r as any).name || ''),
          cost: Number((r as any).cost || 0)
        }))
        .filter((r) => r.id && r.name && Number.isFinite(r.cost) && r.cost > 0);
    } catch {
      return [];
    }
  }
}
