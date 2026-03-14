import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiIntegrationService } from '../api-integration/api-integration.service';

@Injectable()
export class AiBusinessService {
  private readonly logger = new Logger(AiBusinessService.name);

  constructor(
    private prisma: PrismaService,
    private apiIntegration: ApiIntegrationService, // Assuming it has Google Places logic
  ) {}

  async searchPlaces(query: string) {
    this.logger.log(`Searching places: ${query}`);
    return this.apiIntegration.searchGooglePlaces(query);
  }

  async getPlaceDetails(placeId: string) {
    return this.apiIntegration.getPlaceDetails(placeId);
  }

  async detectDuplicates(name: string, lat: number, lng: number) {
    // Check for similar names or close proximity
    const potentialDuplicates = await this.prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          // Prisma doesn't support geospatial queries natively easily without raw SQL, 
          // but we can check name first.
        ]
      },
      include: { owner: true }
    });

    return potentialDuplicates.map(biz => ({
      id: biz.id,
      name: biz.name,
      owner: biz.owner.fullName,
      similarity: biz.name.toLowerCase() === name.toLowerCase() ? 'EXACT' : biz.name.toLowerCase().includes(name.toLowerCase()) ? 'HIGH' : 'MEDIUM'
    }));
  }

  async completeBusinessProfile(partialData: any) {
    let description = partialData.description;
    if (!description && partialData.name && partialData.category) {
      description = `Welcome to ${partialData.name}, a premier ${partialData.category} located in the heart of the city. We pride ourselves on excellent service and a welcoming atmosphere.`;
    }

    return {
      ...partialData,
      description,
      email: partialData.email || null,
    };
  }
}
