import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SeoAiService } from './seo-ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('seo/ai')
@UseGuards(JwtAuthGuard)
export class SeoAiController {
  constructor(private service: SeoAiService) {}

  @Post('generate-keywords')
  async generateKeywords(@Body() body: { businessName: string; category: string; city: string }) {
    const { businessName, category, city } = body;
    const base = category || 'business';
    const location = city || 'location';

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
        `luxury ${base} for families in ${location}`
      ]
    };
  }
}
