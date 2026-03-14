import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleLogCleanup() {
    this.logger.debug('Running log cleanup...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const traffic = await this.prisma.trafficLog.deleteMany({
      where: { timestamp: { lt: thirtyDaysAgo } }
    });
    
    const audit = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });

    this.logger.debug(`Deleted ${traffic.count} traffic logs and ${audit.count} audit logs.`);
  }
}
