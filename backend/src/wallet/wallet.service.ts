import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PaginationDto, getPagination } from '../common/dto/pagination.dto';
import { WalletTransactionService } from './wallet-transaction.service';
import { AdminFinancialLogsService } from './admin-financial-logs.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  // Points to USD conversion rate: 10 points = 1 USD
  private readonly POINTS_TO_USD_RATE = 10;

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private walletTransactions: WalletTransactionService,
    private adminFinancialLogs: AdminFinancialLogsService
  ) { }

  private async getPointsBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentPoints: true }
    });
    return user?.currentPoints || 0;
  }

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!wallet) {
      // Create wallet if it doesn't exist for the user
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: 'USD'
        },
        include: {
          transactions: true
        }
      });
    }

    // Get Points from User table (Optimized)
    const points = await this.getPointsBalance(userId);

    return {
      ...wallet,
      points
    };
  }

  async getHistory(userId: string, pagination?: PaginationDto) {
    const { skip, take } = getPagination(pagination || {});
    return this.prisma.walletTransaction.findMany({
      where: { wallet: { userId } },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async charge(userId: string, amount: number, referenceId: string, tx?: any) {
    const prisma = tx || this.prisma;
    
    // Ensure wallet exists
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
       // Should not happen for active users usually, but safe to check
       throw new NotFoundException('Wallet not found');
    }

    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    
    if (tx) {
      const res = await this.walletTransactions.debitWalletWithCompletedTransaction(
        {
          userId,
          amount,
          currency: wallet.currency,
          type: 'PAYMENT',
          provider: 'WALLET',
          referenceId
        },
        prisma
      );
      return res.wallet;
    }

    const result = await this.walletTransactions.debitWalletWithCompletedTransaction({
      userId,
      amount,
      currency: wallet.currency,
      type: 'PAYMENT',
      provider: 'WALLET',
      referenceId
    });

    return result.wallet;
  }

  async refund(userId: string, amount: number, referenceId: string, tx?: any) {
    const prisma = tx || this.prisma;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    if (tx) {
      const res = await this.walletTransactions.creditWalletWithCompletedTransaction(
        {
          userId,
          amount,
          currency: wallet.currency,
          type: 'REFUND',
          provider: 'WALLET',
          referenceId
        },
        prisma
      );
      return res.wallet;
    }

    const result = await this.walletTransactions.creditWalletWithCompletedTransaction({
      userId,
      amount,
      currency: wallet.currency,
      type: 'REFUND',
      provider: 'WALLET',
      referenceId
    });

    return result.wallet;
  }

  async addFunds(userId: string, amount: number, provider: string = 'STRIPE', providerRefId?: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const result = await this.walletTransactions.creditWalletWithCompletedTransaction({
      userId,
      amount,
      currency: wallet.currency,
      type: 'DEPOSIT',
      provider,
      providerRefId: providerRefId ?? null
    });

    return result.wallet;
  }

  // --- REWARD SYSTEM (Points) ---
  async rewardUser(adminId: string, targetUserId: string, points: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');

    // Transaction: Update Balance & Log to Ledger
    const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Update User Balance
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { currentPoints: { increment: points } }
        });

        // 2. Log to Ledger
        await prisma.pointsLedger.create({
            data: {
                userId: targetUserId,
                points: points,
                reason: reason
            }
        });

        return updatedUser;
    });

    return { success: true, newPointsBalance: result.currentPoints };
  }

  // --- TRANSFER SYSTEM (Points) ---
  async transferPoints(fromUserId: string, toUserId: string, points: number) {
    if (fromUserId === toUserId) throw new BadRequestException('Cannot transfer to self');
    if (points <= 0) throw new BadRequestException('Points must be positive');

    // Remove pre-check to prevent race condition, do it inside transaction
    const recipient = await this.prisma.user.findUnique({ where: { id: toUserId } });
    if (!recipient) throw new NotFoundException('Recipient not found');

    await this.prisma.$transaction(async (prisma) => {
      // 1. Deduct from sender (Atomic Check)
      const sender = await prisma.user.update({
        where: { id: fromUserId },
        data: { currentPoints: { decrement: points } }
      });
      
      if (sender.currentPoints < 0) {
        throw new BadRequestException('Insufficient points');
      }
      
      // 2. Add to recipient
      await prisma.user.update({
        where: { id: toUserId },
        data: { currentPoints: { increment: points } }
      });

      // 3. Log for Sender (Negative points)
      await prisma.pointsLedger.create({
        data: {
          userId: fromUserId,
          points: -points,
          reason: `Transfer to ${recipient.email}`
        }
      });

      // 4. Log for Recipient (Positive points)
      await prisma.pointsLedger.create({
        data: {
          userId: toUserId,
          points: points,
          reason: `Transfer from sender` // Can't easily get sender email without query, but ok
        }
      });
    });

    return { success: true, message: 'Transfer successful' };
  }

  async compensate(fromUserId: string, toUserId: string, amount: number, reason: string) {
    if (fromUserId === toUserId) throw new BadRequestException('Cannot compensate self');
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Amount must be positive');
    if (!reason) throw new BadRequestException('Reason is required');

    const recipient = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: toUserId }, { email: toUserId.toLowerCase() }]
      }
    });
    if (!recipient) throw new NotFoundException('Recipient not found');

    await this.prisma.$transaction(async (tx) => {
      const senderWallet = await this.walletTransactions.ensureWallet(fromUserId, 'USD', tx);
      const recipientWallet = await this.walletTransactions.ensureWallet(recipient.id, senderWallet.currency || 'USD', tx);

      await this.walletTransactions.debitWalletWithCompletedTransaction(
        {
          userId: fromUserId,
          amount,
          currency: senderWallet.currency,
          type: 'COMPENSATION',
          provider: 'WALLET',
          referenceId: `COMPENSATE:${toUserId}`,
          metadata: { reason }
        },
        tx
      );

      await this.walletTransactions.creditWalletWithCompletedTransaction(
        {
          userId: recipient.id,
          amount,
          currency: recipientWallet.currency,
          type: 'COMPENSATION',
          provider: 'WALLET',
          referenceId: `COMPENSATION_FROM:${fromUserId}`,
          metadata: { reason }
        },
        tx
      );

      await tx.auditLog.create({
        data: {
          userId: fromUserId,
          action: 'BUSINESS_COMPENSATION',
          resource: 'WALLET',
          details: { toUserId: recipient.id, amount, reason }
        }
      });
    });

    try {
      this.notificationsGateway.sendToUser(recipient.id, 'wallet.compensation', {
        amount,
        currency: 'USD',
        reason
      });
    } catch {}

    return { success: true };
  }

  // --- CONVERT POINTS TO WALLET BALANCE (Internal Feature) ---
  async convertPointsToCash(userId: string, pointsToConvert: number) {
     const cashValue = pointsToConvert / this.POINTS_TO_USD_RATE;

     await this.prisma.$transaction(async (prisma) => {
         // 1. Deduct Points from User (Atomic Check)
         const user = await prisma.user.update({
             where: { id: userId },
             data: { currentPoints: { decrement: pointsToConvert } }
         });

         if (user.currentPoints < 0) {
            throw new BadRequestException('Insufficient points');
         }

         // 2. Log Points Deduction
         await prisma.pointsLedger.create({
             data: {
                 userId: userId,
                 points: -pointsToConvert,
                 reason: 'Converted to Cash'
             }
         });

         // 3. Add to Wallet Balance
         await this.walletTransactions.creditWalletWithCompletedTransaction(
           {
             userId,
             amount: cashValue,
             currency: 'USD',
             type: 'DEPOSIT',
             provider: 'POINTS',
             referenceId: `cnv-${Date.now()}`
           },
           prisma
         );
     });

     return { success: true, convertedAmount: cashValue };
  }

  // --- ADMIN FUNCTIONS ---

  async getAllTransactions(filter: { status?: string; type?: string; userId?: string }, pagination?: PaginationDto) {
    const { skip, take } = getPagination(pagination || {});
    const where: any = {};
    if (filter.status) where.status = filter.status.toUpperCase();
    if (filter.type) where.type = filter.type.toUpperCase();
    if (filter.userId) where.wallet = { userId: filter.userId };

    return this.prisma.walletTransaction.findMany({
      where,
      skip,
      take,
      include: {
        wallet: {
          include: { user: { select: { id: true, email: true, fullName: true, avatarUrl: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAdminStats() {
    const totalVolume = await this.prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' }
    });

    const pendingAmount = await this.prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { status: 'PENDING' }
    });

    const flaggedCount = await this.prisma.walletTransaction.count({
      where: { status: 'FLAGGED' }
    });

    return {
      totalVolume: totalVolume._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0,
      flaggedCount
    };
  }

  async approveWithdrawal(transactionId: string, adminId: string) {
    const txn = await this.prisma.walletTransaction.findUnique({ where: { id: transactionId } });
    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.status !== 'PENDING' && txn.status !== 'FLAGGED') {
        throw new BadRequestException('Transaction already processed');
    }

    if (txn.type === 'DEPOSIT' && txn.provider === 'BANK_TRANSFER') {
      return this.walletTransactions.finalizePendingDeposit(transactionId, txn.providerRefId ?? null, {
        adminId,
        adminActionType: 'bank_transfer_validation',
        adminReason: null
      });
    }

    return this.walletTransactions.finalizePendingWithdrawal(transactionId, adminId, {
      adminActionType: 'withdrawal_approval',
      adminReason: null
    });
  }

  async rejectWithdrawal(transactionId: string, reason: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const txn = await tx.walletTransaction.findUnique({
        where: { id: transactionId },
        include: { wallet: true }
      });
      if (!txn) throw new NotFoundException('Transaction not found');

      const updated = await tx.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          approvedBy: adminId,
          approvedAt: new Date()
        }
      });

      await this.adminFinancialLogs.log(
        {
          adminId,
          actionType: 'withdrawal_rejection',
          targetUserId: txn.wallet?.userId ?? null,
          amount: Number(txn.amount),
          currency: txn.currency ?? null,
          reason,
          transactionId: updated.id
        },
        tx
      );

      return updated;
    });
  }

  async flagTransaction(transactionId: string) {
    const updated = await this.prisma.walletTransaction.update({
        where: { id: transactionId },
        data: { status: 'FLAGGED', fraudFlag: true }
    });
    return updated;
  }

  async adminAdjustBalance(userId: string, amount: number, reason: string, adminId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
        // Create if missing
        await this.prisma.wallet.create({ data: { userId, balance: 0 } });
        // Re-fetch to be safe or just use user ID logic
    }
    
    // Using upsert or finding again
    const targetWallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!targetWallet) throw new NotFoundException('Wallet error');

    if (amount === 0) throw new BadRequestException('Amount cannot be zero');

    if (amount > 0) {
      const res = await this.walletTransactions.creditWalletWithCompletedTransaction({
        userId,
        amount,
        currency: targetWallet.currency,
        type: 'ADMIN_ADJUSTMENT',
        provider: 'ADMIN',
        referenceId: `ADMIN-ADJ-${Date.now()}`,
        adminId,
        adminActionType: 'wallet_credit',
        adminReason: reason
      });
      return res.wallet;
    }

    const res = await this.walletTransactions.debitWalletWithCompletedTransaction({
      userId,
      amount: Math.abs(amount),
      currency: targetWallet.currency,
      type: 'ADMIN_ADJUSTMENT',
      provider: 'ADMIN',
      referenceId: `ADMIN-ADJ-${Date.now()}`,
      adminId,
      adminActionType: 'wallet_debit',
      adminReason: reason
    });

    return res.wallet;
  }

  async adminTransfer(fromUserId: string, toUserId: string, amount: number, reason: string, adminId: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const fromWallet = await this.prisma.wallet.findUnique({ where: { userId: fromUserId } });
    const toWallet = await this.prisma.wallet.findUnique({ where: { userId: toUserId } });

    if (!fromWallet || !toWallet) throw new NotFoundException('One or both wallets not found');

    return this.prisma.$transaction(async (prisma) => {
      await this.walletTransactions.debitWalletWithCompletedTransaction(
        {
          userId: fromUserId,
          amount,
          currency: fromWallet.currency,
          type: 'TRANSFER_OUT',
          provider: 'ADMIN',
          referenceId: `TRF-TO-${toUserId}`,
          adminId,
          adminActionType: 'wallet_debit',
          adminReason: reason
        },
        prisma
      );

      await this.walletTransactions.creditWalletWithCompletedTransaction(
        {
          userId: toUserId,
          amount,
          currency: toWallet.currency,
          type: 'TRANSFER_IN',
          provider: 'ADMIN',
          referenceId: `TRF-FROM-${fromUserId}`,
          adminId,
          adminActionType: 'wallet_credit',
          adminReason: reason
        },
        prisma
      );

      return { success: true };
    });
  }
}
