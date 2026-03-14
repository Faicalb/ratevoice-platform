import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiIntegrationService } from '../api-integration/api-integration.service';
import { ReviewAnalysisService } from './review-analysis.service';
import { ReviewMappingService } from './review-mapping.service';

@Injectable()
export class ReviewImportService {
  private readonly logger = new Logger(ReviewImportService.name);

  constructor(
    private prisma: PrismaService,
    private apiIntegration: ApiIntegrationService,
    private analysisService: ReviewAnalysisService,
    private mappingService: ReviewMappingService
  ) {}

  async importReviewsForBusiness(businessId: string, limit: number = 20) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { branches: true }
    });

    if (!business) return { status: 'FAILED', reason: 'BUSINESS_NOT_FOUND' };

    this.logger.log(`Starting review import for ${business.name}`);

    // 1. Identify External Business
    let placeId = null;
    const branch = business.branches[0];

    // Try search by name + city first if branch exists
    if (branch && branch.city) {
        const query = `${business.name} in ${branch.city}, ${branch.country || ''}`;
        const searchResults = await this.apiIntegration.searchGooglePlaces(query);
        if (searchResults && searchResults.length > 0) {
            placeId = searchResults[0].place_id;
        }
    } else {
        // Fallback to name only
        const searchResults = await this.apiIntegration.searchGooglePlaces(business.name);
        if (searchResults && searchResults.length > 0) {
            placeId = searchResults[0].place_id;
        }
    }

    if (!placeId) {
        this.logger.warn(`Could not find external listing for ${business.name}`);
        return { status: 'FAILED', reason: 'EXTERNAL_LISTING_NOT_FOUND' };
    }

    // 2. Fetch Details & Reviews
    const details = await this.apiIntegration.getPlaceDetails(placeId);
    
    if (!details || !details.reviews || details.reviews.length === 0) {
        this.logger.warn(`No reviews found for ${business.name}`);
        return { status: 'SKIPPED', reason: 'NO_REVIEWS_AVAILABLE' };
    }

    const reviews = details.reviews.slice(0, limit);
    let importedCount = 0;

    for (const review of reviews) {
        // 3. Duplicate Check
        // Use unique constraint or findFirst
        const existing = await this.prisma.importedReview.findFirst({
            where: {
                businessId: business.id,
                authorName: review.author_name,
                reviewDate: new Date(review.time * 1000),
                reviewText: review.text // Exact match might fail with whitespace but good enough
            }
        });

        if (existing) continue;

        // 4. Analysis (Mocked or Real)
        const analysis = await this.analysisService.analyzeReview(review.text, review.language);

        // 5. Store
        await this.prisma.importedReview.create({
            data: {
                businessId: business.id,
                sourcePlatform: 'GOOGLE',
                externalId: review.author_url || `google_${review.time}_${review.author_name}`, // Fallback ID
                authorName: review.author_name,
                rating: review.rating,
                reviewText: review.text,
                reviewDate: new Date(review.time * 1000),
                language: review.language || 'en',
                sentimentScore: analysis.sentimentScore || 0,
                sentimentLabel: analysis.sentimentLabel || 'NEUTRAL',
                topics: analysis.topics || [],
                keywords: analysis.keywords || []
            }
        });
        importedCount++;
    }

    return { status: 'SUCCESS', imported: importedCount, total_available: reviews.length };
  }

  async importReviewsByCity(city: string, country: string, limit: number = 5) {
      // Find businesses in DB matching city/country
      // Then run import for each
      const branches = await this.prisma.businessBranch.findMany({
          where: {
              city: { contains: city, mode: 'insensitive' },
              country: { contains: country, mode: 'insensitive' }
          },
          include: { business: true },
          take: limit
      });

      const results: any[] = [];
      for (const branch of branches) {
          try {
              const res = await this.importReviewsForBusiness(branch.businessId);
              results.push({ business: branch.business.name, result: res });
          } catch (e) {
              results.push({ business: branch.business.name, error: e.message });
          }
      }
      return { 
          processed: branches.length, 
          details: results 
      };
  }
}
