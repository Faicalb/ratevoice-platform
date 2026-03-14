import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemHealthAIService {
  constructor(private prisma: PrismaService) {}

  async analyzeSystem() {
    const since = new Date(Date.now() - 60 * 60_000);
    const errorGroups = await this.prisma.trafficLog.groupBy({
      by: ['path', 'statusCode'],
      where: { timestamp: { gt: since }, statusCode: { gte: 400 } },
      _count: { path: true }
    });
    const errorLogs = errorGroups
      .sort((a, b) => (b._count.path || 0) - (a._count.path || 0))
      .slice(0, 10)
      .map((e) => ({ endpoint: e.path, statusCode: e.statusCode, count: e._count.path || 0 }));

    // 3. Generate Suggestions based on rules
    const insights: { severity: string; issue: string; cause: string; suggestion: string }[] = [];

    const top4xx = errorLogs.filter((e) => e.statusCode >= 400 && e.statusCode < 500);
    if (top4xx.some((e) => e.count >= 25)) {
      insights.push({
        severity: 'warning',
        issue: 'High client error rate (4xx) detected',
        cause: 'Potential client-side validation mismatch, expired tokens, or malformed requests',
        suggestion: 'Inspect top endpoints by 4xx count and align DTO validation + frontend payloads.'
      });
    }

    const top5xx = errorLogs.filter((e) => e.statusCode >= 500);
    if (top5xx.some((e) => e.count >= 5)) {
      insights.push({
        severity: 'critical',
        issue: 'Elevated server error rate (5xx) detected',
        cause: 'Unhandled exceptions or downstream dependency failures',
        suggestion: 'Review logs for failing endpoints and add retries/timeouts for external calls.'
      });
    }

    const recentTraffic = await this.prisma.trafficLog.count({
      where: { timestamp: { gt: new Date(Date.now() - 60_000) } }
    });
    if (recentTraffic > 1000) {
      insights.push({
        severity: 'info',
        issue: 'Unusual traffic spike detected',
        cause: 'Potential marketing campaign or bot activity',
        suggestion: 'Verify rate limiting behavior and review suspicious IPs and 429 counts.'
      });
    }

    return {
      status: insights.length > 0 ? 'attention_needed' : 'healthy',
      insights,
      topErrors: errorLogs
    };
  }
}
