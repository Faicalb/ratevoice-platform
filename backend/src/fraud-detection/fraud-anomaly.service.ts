import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FraudAnomalyService {
  private readonly logger = new Logger(FraudAnomalyService.name);

  constructor(private prisma: PrismaService) {}

  async checkDeviceFingerprint(userId: string, deviceHash: string): Promise<{ score: number; reason?: string }> {
    // 1. Check if same device is used by multiple users
    const duplicateUsers = await this.prisma.deviceFingerprint.groupBy({
      by: ['userId'],
      where: { deviceHash },
      _count: true
    });

    if (duplicateUsers.length > 3) {
      return { score: 70, reason: `Device used by ${duplicateUsers.length} different users` };
    }

    if (duplicateUsers.length > 1) {
      return { score: 30, reason: `Device used by ${duplicateUsers.length} users` };
    }

    return { score: 0 };
  }

  async checkGeolocation(ambassadorId: string, location: string): Promise<{ score: number; reason?: string }> {
    // Simplified: If ambassador country is X but transactions from many countries in short time
    const logs = await this.prisma.ambassadorActivityLog.findMany({
      where: { ambassadorId, createdAt: { gte: new Date(Date.now() - 3600000) } }, // 1h
      orderBy: { createdAt: 'desc' }
    });

    const uniqueLocations = new Set(logs.map(l => l.location).filter(Boolean));
    if (uniqueLocations.size > 2) {
      return { score: 50, reason: `Activity from ${uniqueLocations.size} locations in 1 hour` };
    }

    return { score: 0 };
  }
}
