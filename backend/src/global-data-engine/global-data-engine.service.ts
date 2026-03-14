import { Injectable, Logger } from '@nestjs/common';
import { GlobalDiscoveryService } from './global-discovery.service';
import { BusinessImportService } from './business-import.service';

@Injectable()
export class GlobalDataEngineService {
  private readonly logger = new Logger(GlobalDataEngineService.name);

  constructor(
    private discoveryService: GlobalDiscoveryService,
    private importService: BusinessImportService
  ) {}

  async discoverBusinesses(city: string, country: string, type: string, limit: number = 20) {
    this.logger.log(`Starting discovery for ${type} in ${city}, ${country} (Limit: ${limit})`);
    return this.discoveryService.searchBusinesses(city, country, type, limit);
  }

  async importBusinesses(businesses: any[]) {
    this.logger.log(`Starting bulk import for ${businesses.length} businesses`);
    
    const results = {
      total: businesses.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[]
    };

    // Process sequentially or parallel?
    // Parallel might hit DB limits or API rate limits if we download images.
    // Let's do batches of 5.
    const batchSize = 5;
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(biz => this.importService.importBusiness(biz))
      );
      
      for (const res of batchResults) {
        if (res.status === 'IMPORTED') results.imported++;
        else if (res.status === 'SKIPPED') results.skipped++;
        else results.failed++;
        
        results.details.push(res);
      }
    }

    this.logger.log(`Import complete. Imported: ${results.imported}, Skipped: ${results.skipped}, Failed: ${results.failed}`);
    return results;
  }
}
