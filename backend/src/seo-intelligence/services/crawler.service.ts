import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrawlerService {
  constructor(private prisma: PrismaService) {}

  async runAudit(businessId: string) {
    const audit = {
      score: 85,
      missingMeta: false,
      missingSchema: true,
      brokenCanonical: false,
      duplicateTitle: false,
      issues: ["Missing schema markup on homepage", "Load speed could be improved"]
    };

    return this.prisma.seoAudit.create({
      data: {
        businessId,
        score: audit.score,
        missingMeta: audit.missingMeta,
        missingSchema: audit.missingSchema,
        brokenCanonical: audit.brokenCanonical,
        duplicateTitle: audit.duplicateTitle,
        issues: audit.issues as any
      }
    });
  }
  
  async getLatestAudit(businessId: string) {
      return this.prisma.seoAudit.findFirst({
          where: { businessId },
          orderBy: { crawledAt: 'desc' }
      });
  }
}
