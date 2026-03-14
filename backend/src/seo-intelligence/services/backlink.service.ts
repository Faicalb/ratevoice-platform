import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BacklinkService {
  constructor(private prisma: PrismaService) {}

  async getBacklinks(businessId: string) {
    return this.prisma.backlink.findMany({
      where: { businessId },
      orderBy: { authorityScore: 'desc' }
    });
  }

  async analyzeBacklinks(businessId: string) {
    const newLinks = [
      { url: 'https://tripadvisor.com/review/123', authority: 92 },
      { url: 'https://local-blog.com/top-10', authority: 45 }
    ];

    for (const link of newLinks) {
        await this.prisma.backlink.create({
            data: {
                businessId,
                url: link.url,
                authorityScore: link.authority
            }
        });
    }
    return newLinks;
  }
}
