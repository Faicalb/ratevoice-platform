import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SeoPageGeneratorService {
  constructor(private prisma: PrismaService) {}

  async generateCityPage(city: string, category: string) {
    const slug = `${category.toLowerCase()}s-in-${city.toLowerCase()}`.replace(/ /g, '-');
    
    const existing = await this.prisma.seoLandingPage.findUnique({ where: { slug } });
    if (existing) return existing;

    return this.prisma.seoLandingPage.create({
      data: {
        slug,
        title: `Best ${category}s in ${city} - Top Rated Reviews`,
        description: `Find the best ${category}s in ${city}. Read verified reviews, check ratings and book instantly on RateVoice.`,
        keywords: `${category} ${city}, best ${category} ${city}, reviews ${city}`,
        city,
        category,
        content: `Welcome to our curated list of top ${category}s in ${city}. RateVoice helps you find the best places based on real user reviews.`
      }
    });
  }
  
  async getAllPages() {
      return this.prisma.seoLandingPage.findMany({
          orderBy: { createdAt: 'desc' }
      });
  }
}
