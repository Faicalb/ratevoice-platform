import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageImportService } from './image-import.service';
import { AiOwnerEmailFinderService } from '../admin/ai-owner-email-finder.service';
import { ApiIntegrationService } from '../api-integration/api-integration.service';

@Injectable()
export class BusinessImportService {
  private readonly logger = new Logger(BusinessImportService.name);

  constructor(
    private prisma: PrismaService,
    private imageImport: ImageImportService,
    private emailFinder: AiOwnerEmailFinderService,
    private apiIntegration: ApiIntegrationService
  ) {}

  async importBusiness(data: any) {
    // 1. Duplicate Detection
    const isDuplicate = await this.checkDuplicate(data);
    if (isDuplicate) {
      this.logger.warn(`Skipping duplicate: ${data.name}`);
      return { status: 'SKIPPED', reason: 'DUPLICATE' };
    }

    // 2. Resolve Owner ID (Required)
    let ownerId = data.ownerId;
    if (!ownerId) {
        ownerId = await this.getDefaultOwnerId();
    }
    if (!ownerId) {
        return { status: 'FAILED', reason: 'NO_DEFAULT_OWNER_FOUND' };
    }

    // 3. Create Business (Transaction)
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // A. Create Business
        const business = await tx.business.create({
          data: {
            ownerId: ownerId,
            name: data.name,
            description: `Imported from ${data.source || 'Global Engine'}`,
            category: data.category || 'Uncategorized',
            website: data.website,
            status: 'UNCLAIMED',
            ownerEmailFound: false,
          }
        });

        // B. Create Branch
        await tx.businessBranch.create({
          data: {
            businessId: business.id,
            name: `${data.name} Main`,
            address: data.address,
            latitude: Number(data.latitude) || null,
            longitude: Number(data.longitude) || null,
            phoneNumber: data.phone,
            isActive: true
          }
        });

        return business;
      });

      // 4. Process Images (Async)
      if (data.photos && data.photos.length > 0) {
        // Convert references to URLs
        const imageUrls = data.photos.map(p => {
            if (p.photo_reference) {
                return this.apiIntegration.getPhotoUrl(p.photo_reference);
            }
            return p.url; // If direct URL
        }).filter(url => url);

        const uploadedUrls = await this.imageImport.processImages(result.id, imageUrls);
        
        // Save to BusinessImage
        if (uploadedUrls.length > 0) {
            await this.prisma.businessImage.createMany({
                data: uploadedUrls.map((url, index) => ({
                    businessId: result.id,
                    url: url,
                    isMain: index === 0,
                    caption: 'Imported Image'
                }))
            });

            // Update Business Logo if missing
            if (!result.logoUrl) {
                await this.prisma.business.update({
                    where: { id: result.id },
                    data: { logoUrl: uploadedUrls[0] }
                });
            }
        }
      }

      // 5. Owner Discovery (Async)
      this.emailFinder.findOwnerEmail(result.id).catch(err => {
          this.logger.error(`Email finder failed for ${result.id}: ${err.message}`);
      });

      return { status: 'IMPORTED', id: result.id, name: result.name };

    } catch (error) {
      this.logger.error(`Import failed for ${data.name}: ${error.message}`);
      return { status: 'FAILED', reason: error.message };
    }
  }

  private async getDefaultOwnerId(): Promise<string | null> {
      // Find a SUPER_ADMIN to assign unclaimed businesses to
      const admin = await this.prisma.user.findFirst({
          where: { roles: { some: { role: { name: 'SUPER_ADMIN' } } } }
      });
      return admin?.id || null;
  }


  private async checkDuplicate(data: any): Promise<boolean> {
    // Check by Name (normalized)
    const existingName = await this.prisma.business.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' }
      }
    });
    if (existingName) return true;

    // Check by Website
    if (data.website) {
      const existingWeb = await this.prisma.business.findFirst({
        where: { website: { contains: data.website } } // loose match
      });
      if (existingWeb) return true;
    }

    // Check by Coordinates (Branch level)
    if (data.latitude && data.longitude) {
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      const threshold = 0.001; // approx 100m

      const existingLoc = await this.prisma.businessBranch.findFirst({
        where: {
          latitude: { gte: lat - threshold, lte: lat + threshold },
          longitude: { gte: lng - threshold, lte: lng + threshold }
        }
      });
      if (existingLoc) return true;
    }

    return false;
  }
}
