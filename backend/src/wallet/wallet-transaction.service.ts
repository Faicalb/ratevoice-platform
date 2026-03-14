import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WalletTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminFinancialLogsService } from './admin-financial-logs.service';

type CreateCompletedTxInput = {
  userId: string;
  amount: number;
  currency?: string;
  type: string;
  provider?: string | null;
  referenceId?: string | null;
  providerRefId?: string | null;
  metadata?: Record<string, any> | null;
  adminId?: string | null;
  adminActionType?: string | null;
  adminReason?: string | null;
};

type CreatePendingTxInput = {
  userId: string;
  amount: number;
  currency?: string;
  type: string;
  provider?: string | null;
  referenceId?: string | null;
  providerRefId?: string | null;
  proofUrl?: string | null;
  metadata?: Record<string, any> | null;
  status?: string;
};

@Injectable()
export class WalletTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminFinancialLogs: AdminFinancialLogsService
  ) {}

  async ensureWallet(userId: string, currency: string = 'USD', prismaClient: any = this.prisma) {
    const existing = await prismaClient.wallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return prismaClient.wallet.create({
      data: { userId, balance: 0, currency }
    });
  }

  async createPendingTransaction(input: CreatePendingTxInput): Promise<WalletTransaction> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const wallet = await this.ensureWallet(input.userId, input.currency || 'USD', this.prisma);

    return this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency || wallet.currency || 'USD',
        type: input.type,
        provider: input.provider ?? null,
        referenceId: input.referenceId ?? null,
        providerRefId: input.providerRefId ?? null,
        proofUrl: input.proofUrl ?? null,
        metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
        status: (input.status || 'PENDING').toUpperCase()
      }
    });
  }

  async creditWalletWithCompletedTransaction(input: CreateCompletedTxInput, prismaClient?: any) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const run = async (tx: any) => {
      const wallet = await this.ensureWallet(input.userId, input.currency || 'USD', tx);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: input.amount } }
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(input.amount),
          currency: input.currency || wallet.currency || 'USD',
          type: input.type,
          provider: input.provider ?? null,
          referenceId: input.referenceId ?? null,
          providerRefId: input.providerRefId ?? null,
          metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
          status: 'COMPLETED',
          approvedBy: input.adminId ?? null,
          approvedAt: input.adminId ? new Date() : null,
          rejectionReason: input.adminReason ?? null
        }
      });

      if (input.adminId && input.adminActionType) {
        await this.adminFinancialLogs.log({
          adminId: input.adminId,
          actionType: input.adminActionType,
          targetUserId: input.userId,
          amount: input.amount,
          currency: input.currency || wallet.currency || 'USD',
          reason: input.adminReason ?? null,
          transactionId: transaction.id
        }, tx);
      }

      return { wallet: updatedWallet, transaction };
    };

    if (prismaClient) return run(prismaClient);
    return this.prisma.$transaction(async (tx) => run(tx));
  }

  async debitWalletWithCompletedTransaction(input: CreateCompletedTxInput, prismaClient?: any) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const run = async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: input.amount } }
      });

      if (Number(updatedWallet.balance) < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(-input.amount),
          currency: input.currency || wallet.currency || 'USD',
          type: input.type,
          provider: input.provider ?? null,
          referenceId: input.referenceId ?? null,
          providerRefId: input.providerRefId ?? null,
          metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
          status: 'COMPLETED',
          approvedBy: input.adminId ?? null,
          approvedAt: input.adminId ? new Date() : null,
          rejectionReason: input.adminReason ?? null
        }
      });

      if (input.adminId && input.adminActionType) {
        await this.adminFinancialLogs.log({
          adminId: input.adminId,
          actionType: input.adminActionType,
          targetUserId: input.userId,
          amount: input.amount,
          currency: input.currency || wallet.currency || 'USD',
          reason: input.adminReason ?? null,
          transactionId: transaction.id
        }, tx);
      }

      return { wallet: updatedWallet, transaction };
    };

    if (prismaClient) return run(prismaClient);
    return this.prisma.$transaction(async (tx) => run(tx));
  }

  async finalizePendingDeposit(
    transactionId: string,
    providerRefId?: string | null,
    opts?: { adminId?: string | null; adminActionType?: string | null; adminReason?: string | null }
  ) {
    return this.prisma.$transaction(async (tx) => {
      const txn = await tx.walletTransaction.findUnique({
        where: { id: transactionId },
        include: { wallet: true }
      });

      if (!txn) throw new NotFoundException('Transaction not found');
      if (txn.status === 'COMPLETED') return txn;

      if (txn.type !== 'DEPOSIT') {
        throw new BadRequestException('Only deposit transactions can be finalized');
      }

      const nextProviderRefId = providerRefId ?? txn.providerRefId ?? null;
      if (nextProviderRefId) {
        const duplicate = await tx.walletTransaction.findFirst({
          where: {
            id: { not: txn.id },
            provider: txn.provider,
            providerRefId: nextProviderRefId,
            status: 'COMPLETED'
          }
        });
        if (duplicate) {
          return tx.walletTransaction.update({
            where: { id: txn.id },
            data: { status: 'FLAGGED', fraudFlag: true }
          });
        }
      }

      await tx.wallet.update({
        where: { id: txn.walletId },
        data: { balance: { increment: Number(txn.amount) } }
      });

      const updated = await tx.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          providerRefId: nextProviderRefId,
          approvedBy: opts?.adminId ?? null,
          approvedAt: opts?.adminId ? new Date() : null,
          rejectionReason: opts?.adminReason ?? null
        }
      });

      if (opts?.adminId && opts?.adminActionType) {
        await this.adminFinancialLogs.log({
          adminId: opts.adminId,
          actionType: opts.adminActionType,
          targetUserId: txn.wallet.userId,
          amount: Number(txn.amount),
          currency: txn.currency || txn.wallet.currency || 'USD',
          reason: opts.adminReason ?? null,
          transactionId: updated.id
        }, tx);
      }

      return updated;
    });
  }

  async finalizePendingWithdrawal(
    transactionId: string,
    adminId: string,
    opts?: { adminActionType?: string | null; adminReason?: string | null }
  ) {
    return this.prisma.$transaction(async (tx) => {
      const txn = await tx.walletTransaction.findUnique({
        where: { id: transactionId },
        include: { wallet: true }
      });

      if (!txn) throw new NotFoundException('Transaction not found');
      if (txn.status === 'COMPLETED') return txn;
      if (txn.type !== 'WITHDRAWAL') throw new BadRequestException('Only withdrawal transactions can be finalized');
      if (txn.status !== 'PENDING' && txn.status !== 'FLAGGED') throw new BadRequestException('Transaction already processed');

      const updatedWallet = await tx.wallet.update({
        where: { id: txn.walletId },
        data: { balance: { decrement: Number(txn.amount) } }
      });
      if (Number(updatedWallet.balance) < 0) throw new BadRequestException('Insufficient balance');

      const updated = await tx.walletTransaction.update({
        where: { id: txn.id },
        data: {
          status: 'COMPLETED',
          approvedBy: adminId,
          approvedAt: new Date(),
          rejectionReason: opts?.adminReason ?? null
        }
      });

      if (opts?.adminActionType) {
        await this.adminFinancialLogs.log({
          adminId,
          actionType: opts.adminActionType,
          targetUserId: txn.wallet.userId,
          amount: Number(txn.amount),
          currency: txn.currency || txn.wallet.currency || 'USD',
          reason: opts.adminReason ?? null,
          transactionId: updated.id
        }, tx);
      }

      return updated;
    });
  }
}
