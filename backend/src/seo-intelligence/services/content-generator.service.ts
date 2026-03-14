import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentGeneratorService {
  async generateContent(data: { businessName: string, category: string, city: string }) {
    const { businessName, category, city } = data;
    return {
      seoDescription: `Discover ${businessName}, the premier ${category} in ${city}. Experience top-quality service and amenities.`,
      blogIntro: `Are you looking for the best ${category} in ${city}? Look no further than ${businessName}. We offer...`,
      keywords: [`${category} in ${city}`, `best ${category} ${city}`, `${businessName} reviews`]
    };
  }
}
