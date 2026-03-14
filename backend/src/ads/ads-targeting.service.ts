import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdsTargetingService {
  constructor(private prisma: PrismaService) {}

  async getTargetingOptions() {
    // Return available locations and interests
    const countries = await this.prisma.businessBranch.findMany({
      select: { country: true },
      distinct: ['country']
    });
    
    const cities = await this.prisma.businessBranch.findMany({
      select: { city: true },
      distinct: ['city']
    });

    return {
      countries: countries.map(c => c.country).filter(Boolean),
      cities: cities.map(c => c.city).filter(Boolean),
      interests: ['Travel', 'Food', 'Adventure', 'Luxury', 'Budget']
    };
  }
}
