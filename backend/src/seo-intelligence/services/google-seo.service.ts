import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class GoogleSeoService {
  async getPerformance(businessId: string) {
    throw new NotImplementedException('Google Search Console integration is not configured');
  }
}
