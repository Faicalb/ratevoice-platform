import { Injectable } from '@nestjs/common';

@Injectable()
export class BingSeoService {
  async getPerformance(businessId: string) {
    return {
      indexedPages: 42,
      crawlErrors: 0,
      issues: []
    };
  }
}
