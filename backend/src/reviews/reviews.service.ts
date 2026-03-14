import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PaginationDto, getPagination } from '../common/dto/pagination.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService
  ) {}

  async findAll(pagination?: PaginationDto) {
    const { skip, take } = getPagination(pagination || {});

    const textReviews = await this.prisma.textReview.findMany({
      skip,
      take,
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const voiceReviews = await this.prisma.voiceReview.findMany({
      skip,
      take,
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { textReviews, voiceReviews };
  }

  async getVoiceReviews(branchId: string) {
    return this.prisma.voiceReview.findMany({
      where: { branchId },
      include: {
        user: { select: { fullName: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createVoiceReview(
    file: any, 
    userId: string, 
    branchId: string, 
    rating: number
  ) {
    // 1. Upload Audio
    const audioUrl = await this.storage.uploadFile(file, 'voice-reviews');
    if (!audioUrl) {
      throw new Error('Failed to upload voice review');
    }

    // 2. Create DB Record
    return this.prisma.voiceReview.create({
      data: {
        userId,
        branchId,
        audioUrl,
        rating: Number(rating),
        status: 'PUBLISHED',
        transcript: null,
        sentiment: null
      }
    });
  }

  async deleteReview(id: string, type: 'voice' | 'text') {
    if (type === 'voice') {
      const review = await this.prisma.voiceReview.findUnique({ where: { id } });
      if (!review) throw new NotFoundException('Voice Review not found');
      
      if (review.audioUrl) {
        // Extract path from URL (simplified logic)
        const path = review.audioUrl.split('/').pop(); 
        if (path) await this.storage.deleteFile(`voice-reviews/${path}`);
      }
      return this.prisma.voiceReview.delete({ where: { id } });
    } else {
      const review = await this.prisma.textReview.findUnique({ where: { id } });
      if (!review) throw new NotFoundException('Text Review not found');
      return this.prisma.textReview.delete({ where: { id } });
    }
  }
}
