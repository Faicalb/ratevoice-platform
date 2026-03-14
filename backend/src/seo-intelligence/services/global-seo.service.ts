import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GlobalSeoService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.globalSeoSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.globalSeoSettings.create({
        data: {} // defaults handled by schema
      });
    }
    return settings;
  }

  async updateSettings(data: any) {
    const settings = await this.getSettings();
    return this.prisma.globalSeoSettings.update({
      where: { id: settings.id },
      data
    });
  }

  async generateSitemap() {
    const businesses = await this.prisma.business.findMany({
      where: { status: 'ACTIVE' },
      select: { seoSlug: true, updatedAt: true, id: true }
    });
    
    const landingPages = await this.prisma.seoLandingPage.findMany();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ratevoice.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    businesses.forEach(b => {
      xml += `
  <url>
    <loc>https://ratevoice.com/business/${b.seoSlug || b.id}</loc>
    <lastmod>${b.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    landingPages.forEach(p => {
        xml += `
  <url>
    <loc>https://ratevoice.com/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += `
</urlset>`;
    return xml;
  }

  async getRobotsTxt() {
    const settings = await this.getSettings();
    return settings.robotsTxt;
  }
}
