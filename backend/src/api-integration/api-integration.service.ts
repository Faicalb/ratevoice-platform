import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderEncryptionService } from '../api-gateway/services/provider-encryption.service';

@Injectable()
export class ApiIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: ProviderEncryptionService
  ) {}

  private async getGooglePlacesKey() {
    const envKey = process.env.GOOGLE_PLACES_API_KEY;
    if (envKey) return envKey;
    const provider = await this.prisma.externalProvider.findFirst({
      where: { serviceName: 'MAPS', isActive: true, status: 'ACTIVE' },
      orderBy: { priority: 'asc' }
    });
    if (!provider?.apiKey) return null;
    const key = this.encryption.decrypt(provider.apiKey);
    return key || null;
  }

  async searchGooglePlaces(query: string) {
    const apiKey = await this.getGooglePlacesKey();
    if (!apiKey) throw new ServiceUnavailableException('Google Places is not configured');

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query,
            key: apiKey,
          },
        }
      );

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API Error: ${response.data.status}`);
      }

      return response.data.results;
    } catch (error) {
      throw new InternalServerErrorException('Google Places request failed');
    }
  }

  async getPlaceDetails(placeId: string) {
    const apiKey = await this.getGooglePlacesKey();
    if (!apiKey) throw new ServiceUnavailableException('Google Places is not configured');

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'name,formatted_address,international_phone_number,website,rating,types,geometry,opening_hours,photos,reviews',
            key: apiKey,
          },
        }
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Google Place Details API Error: ${response.data.status}`);
      }

      return response.data.result;
    } catch (error) {
      throw new InternalServerErrorException('Google Place Details request failed');
    }
  }

  getPhotoUrl(photoReference: string, maxWidth: number = 400): string | null {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
  }
}
