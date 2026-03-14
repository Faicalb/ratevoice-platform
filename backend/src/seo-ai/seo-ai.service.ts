import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeoAiService {
  constructor(private prisma: PrismaService) {}

  async analyzeBusinessSeo(businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new Error('Business not found');

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. Title Analysis
    const title = business.seoTitle || '';
    if (title.length < 10) {
      issues.push('Title too short');
      suggestions.push('Increase title length to at least 10 characters');
      score -= 10;
    } else if (title.length > 60) {
      issues.push('Title too long');
      suggestions.push('Reduce title length to 60 characters');
      score -= 10;
    }

    // 2. Description Analysis
    const desc = business.seoDescription || '';
    if (desc.length < 50) {
      issues.push('Description too short');
      suggestions.push('Add a meta description (50-160 chars)');
      score -= 20;
    } else if (desc.length > 160) {
      issues.push('Description too long');
      suggestions.push('Shorten description to 160 characters');
      score -= 10;
    }

    // 3. Keyword Analysis
    const keywords = business.seoKeywords ? business.seoKeywords.split(',').map(k => k.trim()) : [];
    if (keywords.length < 3) {
      issues.push('Not enough keywords');
      suggestions.push('Add at least 3 relevant keywords');
      score -= 20;
    }

    // 4. Slug Analysis
    if (!business.seoSlug) {
      issues.push('Missing SEO Slug');
      suggestions.push('Set a custom URL slug');
      score -= 10;
    }

    // 5. Spam Detection
    const spamCheck = await this.detectSpam(business.seoTitle, business.seoDescription, business.seoKeywords);
    if (spamCheck.isSpam) {
      score -= 20;
      issues.push('Spam detected in SEO content');
      suggestions.push('Remove repetitive keywords');
      
      // Auto-flag
      await this.prisma.business.update({
        where: { id: businessId },
        data: { seoFlag: true, seoSpamScore: spamCheck.score }
      });
    }

    // Cap score
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      suggestions,
      spamDetected: spamCheck.isSpam
    };
  }

  async detectSpam(title?: string | null, desc?: string | null, keywords?: string | null) {
    let spamScore = 0;
    const text = `${title ?? ''} ${desc ?? ''} ${keywords ?? ''}`.toLowerCase();
    
    // Simple repetition check
    const words = text.split(/\s+/);
    const wordCounts = {};
    words.forEach(w => {
      if (w.length > 3) wordCounts[w] = (wordCounts[w] || 0) + 1;
    });

    Object.values(wordCounts).forEach((count: number) => {
      if (count > 5) spamScore += 10;
    });

    return {
      isSpam: spamScore > 20,
      score: spamScore
    };
  }

  async generateKeywords(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { branches: true }
    });
    if (!business) throw new Error('Business not found');

    const base = business.category || 'business';
    const location = business.branches?.[0]?.city || business.branches?.[0]?.country || '';

    return {
      seo: [
        `${base} ${location}`,
        `best ${base} in ${location}`,
        `top rated ${base}`,
        `${base} near me`
      ],
      local: [
        `${base} ${location} center`,
        `${base} near airport`
      ],
      longTail: [
        `affordable ${base} with parking in ${location}`,
        `luxury ${base} for families`
      ]
    };
  }

  async optimizeSeo(businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new Error('Business not found');

    const base = business.category || 'Business';
    
    return {
      seoTitle: `Best ${base} in Town - ${business.name}`,
      seoDescription: `Welcome to ${business.name}, the top rated ${base} offering quality services. Visit us today!`,
      seoKeywords: `${base}, best ${base}, top rated, ${business.name}`,
      seoSlug: business.name.toLowerCase().replace(/ /g, '-')
    };
  }

  async checkHealth(businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new Error('Business not found');
    const metaErrors: string[] = [];
    if (!business.seoTitle || business.seoTitle.length < 10) metaErrors.push('Missing or short SEO title');
    if (!business.seoDescription || business.seoDescription.length < 50) metaErrors.push('Missing or short SEO description');
    const issues = metaErrors.length > 0;
    
    await this.prisma.seoHealth.upsert({
      where: { businessId },
      create: {
        businessId,
        indexed: !issues,
        metaErrors,
        lastScan: new Date()
      },
      update: {
        indexed: !issues,
        metaErrors,
        lastScan: new Date()
      }
    });
  }
}
