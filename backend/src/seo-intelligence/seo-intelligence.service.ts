import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleSeoService } from './services/google-seo.service';
import { BingSeoService } from './services/bing-seo.service';
import { SerpTrackerService } from './services/serp-tracker.service';
import { BacklinkService } from './services/backlink.service';
import { CrawlerService } from './services/crawler.service';
import { ContentGeneratorService } from './services/content-generator.service';

@Injectable()
export class SeoIntelligenceService {
  constructor(
    private prisma: PrismaService,
    private google: GoogleSeoService,
    private bing: BingSeoService,
    private serp: SerpTrackerService,
    private backlink: BacklinkService,
    private crawler: CrawlerService,
    private content: ContentGeneratorService
  ) {}

  async getDashboardData(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return null;

    const results = await Promise.allSettled([
      this.google.getPerformance(business.id),
      this.bing.getPerformance(business.id),
      this.serp.getRankings(business.id),
      this.backlink.getBacklinks(business.id),
      this.crawler.getLatestAudit(business.id)
    ]);

    return {
      google: results[0].status === 'fulfilled' ? results[0].value : null,
      bing: results[1].status === 'fulfilled' ? results[1].value : null,
      rankings: results[2].status === 'fulfilled' ? results[2].value : [],
      backlinks: results[3].status === 'fulfilled' ? results[3].value : [],
      audit: results[4].status === 'fulfilled' ? results[4].value : null,
    };
  }

  async runAudit(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new Error('Business not found');
    return this.crawler.runAudit(business.id);
  }

  async generateContent(userId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) throw new Error('Business not found');
    return this.content.generateContent({ 
        businessName: business.name, 
        category: business.category || 'Business', 
        city: 'Casablanca' 
    });
  }
}
