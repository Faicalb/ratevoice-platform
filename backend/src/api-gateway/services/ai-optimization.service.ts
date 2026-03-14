import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiOptimizationService {
  private readonly logger = new Logger(AiOptimizationService.name);

  constructor(private prisma: PrismaService) {}

  async getRecommendations() {
    // Logic: Compare providers in same service category.
    // Group by serviceName
    const providers = await this.prisma.externalProvider.findMany({
      where: { isActive: true },
      include: {
        metrics: {
          take: 100, // Last 100 requests
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    const grouped = {};
    for (const p of providers) {
      if (!grouped[p.serviceName]) grouped[p.serviceName] = [];
      
      const avgLatency = p.metrics.length > 0 
        ? p.metrics.reduce((sum, m) => sum + m.latency, 0) / p.metrics.length 
        : p.currentLatency;
      
      const errorRate = p.metrics.length > 0
        ? (p.metrics.filter(m => !m.success).length / p.metrics.length) * 100
        : 0;

      grouped[p.serviceName].push({
        id: p.id,
        name: p.providerName,
        latency: avgLatency,
        errorRate: errorRate,
        cost: p.costPerUnit
      });
    }

    const recommendations: any[] = [];

    for (const category in grouped) {
      const group = grouped[category];
      if (group.length < 2) continue; // Need at least 2 to compare

      // Sort by latency
      const sortedByLatency = [...group].sort((a, b) => a.latency - b.latency);
      const fastest = sortedByLatency[0];
      const slowest = sortedByLatency[sortedByLatency.length - 1];

      if (slowest.latency > fastest.latency * 1.3) { // 30% slower
        const diff = Math.round(((slowest.latency - fastest.latency) / slowest.latency) * 100);
        recommendations.push({
          type: 'PERFORMANCE',
          category,
          message: `${fastest.name} is ${diff}% faster than ${slowest.name}. Consider switching for better performance.`
        });
      }

      // Sort by cost
      const sortedByCost = [...group].sort((a, b) => a.cost - b.cost);
      const cheapest = sortedByCost[0];
      const expensive = sortedByCost[sortedByCost.length - 1];

      if (expensive.cost > cheapest.cost * 1.2 && cheapest.cost > 0) {
        const savings = Math.round(((expensive.cost - cheapest.cost) / expensive.cost) * 100);
        recommendations.push({
          type: 'COST',
          category,
          message: `${cheapest.name} is ${savings}% cheaper than ${expensive.name}.`
        });
      }
    }

    return recommendations;
  }
}
