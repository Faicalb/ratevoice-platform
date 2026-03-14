import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AdsBillingService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService
  ) {}

  async processPayment(adId: string, amount: number) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      include: { campaign: { include: { business: true } } }
    });
    if (!ad) throw new NotFoundException('Ad not found');
    if (!ad.campaign?.business?.ownerId) throw new NotFoundException('Ad owner not found');

    const userId = ad.campaign.business.ownerId;
    const res = await this.prisma.$transaction(async (tx) => {
      await this.walletService.charge(userId, amount, `ad-${adId}`, tx);
      return tx.walletTransaction.findFirst({
        where: { referenceId: `ad-${adId}` },
        orderBy: { createdAt: 'desc' }
      });
    });

    return { success: true, transactionId: res?.id || null };
  }
}
