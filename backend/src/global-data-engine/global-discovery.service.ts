import { Injectable, Logger } from '@nestjs/common';
import { ApiIntegrationService } from '../api-integration/api-integration.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GlobalDiscoveryService {
  private readonly logger = new Logger(GlobalDiscoveryService.name);

  constructor(
    private apiIntegration: ApiIntegrationService,
    private prisma: PrismaService
  ) {}

  async searchBusinesses(city: string, country: string, type: string, limit: number = 20) {
    const query = `${type} in ${city}, ${country}`;
    this.logger.log(`Searching for: ${query}`);

    // 1. Fetch from Google Places
    const places = await this.apiIntegration.searchGooglePlaces(query);

    // 2. Process and Normalize Data
    const results: any[] = [];
    for (const place of places) {
      // Get detailed info for each place to get website, phone, etc.
      // Note: This might be expensive on API quota. For bulk, maybe we just use basic info first?
      // The prompt says "Collect: Name, Address, Coordinates, Phone, Website, Images, Rating, Category"
      // Basic search returns Name, Address, Coordinates, Rating, Types.
      // Phone and Website require Place Details.
      
      try {
        const details = await this.apiIntegration.getPlaceDetails(place.place_id);
        
        results.push({
          externalId: place.place_id,
          name: details.name || place.name,
          address: details.formatted_address || place.formatted_address,
          latitude: details.geometry?.location?.lat || place.geometry?.location?.lat,
          longitude: details.geometry?.location?.lng || place.geometry?.location?.lng,
          phone: details.international_phone_number || details.formatted_phone_number,
          website: details.website,
          rating: details.rating || place.rating,
          category: type, // Or map from place.types
          types: details.types || place.types,
          photos: details.photos || place.photos, // Array of photo references
          source: 'GOOGLE_PLACES'
        });

        if (results.length >= limit) break;
      } catch (e) {
        this.logger.error(`Failed to get details for ${place.place_id}: ${e.message}`);
      }
    }

    return results;
  }
}
