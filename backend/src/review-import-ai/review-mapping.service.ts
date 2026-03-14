import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewMappingService {
  private readonly logger = new Logger(ReviewMappingService.name);

  constructor(private prisma: PrismaService) {}

  async matchBusiness(searchParams: { name: string; address?: string; website?: string; lat?: number; lng?: number }) {
    this.logger.log(`Attempting to match business: ${searchParams.name}`);

    // 1. Try Exact Website Match
    if (searchParams.website) {
      const match = await this.prisma.business.findFirst({
        where: { website: { contains: searchParams.website, mode: 'insensitive' } }
      });
      if (match) return match;
    }

    // 2. Try Name Match (Fuzzy-ish)
    // Simple case-insensitive match for now
    const nameMatches = await this.prisma.business.findMany({
      where: {
        name: { contains: searchParams.name, mode: 'insensitive' }
      },
      include: { branches: true }
    });

    if (nameMatches.length === 1) return nameMatches[0];

    // 3. If multiple name matches, filter by location (Branch level)
    if (nameMatches.length > 1 && searchParams.lat != null && searchParams.lng != null) {
      const threshold = 0.005; // approx 500m
      for (const biz of nameMatches) {
        // Find a matching branch
        const branch = biz.branches.find(b => 
           Math.abs((b.latitude || 0) - (searchParams.lat || 0)) < threshold &&
           Math.abs((b.longitude || 0) - (searchParams.lng || 0)) < threshold
        );
        if (branch) return biz;
      }
    }

    // 4. Fallback: Check if we have an external ID stored (future enhancement)
    
    return null;
  }
}
