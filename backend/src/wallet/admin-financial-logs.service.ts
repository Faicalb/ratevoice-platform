import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LogInput = {
  adminId: string;
  actionType: string;
  targetUserId?: string | null;
  amount?: number | null;
  currency?: string | null;
  reason?: string | null;
  transactionId?: string | null;
};

@Injectable()
export class AdminFinancialLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogInput, prismaClient?: any) {
    const prisma = prismaClient || this.prisma;
    return prisma.adminFinancialLog.create({
      data: {
        adminId: input.adminId,
        actionType: input.actionType,
        targetUserId: input.targetUserId ?? null,
        amount: input.amount == null ? null : new Prisma.Decimal(input.amount),
        currency: input.currency ?? null,
        reason: input.reason ?? null,
        transactionId: input.transactionId ?? null
      }
    });
  }

  async list(filter: { adminId?: string; targetUserId?: string; transactionId?: string }, pagination?: { skip?: number; take?: number }) {
    return this.prisma.adminFinancialLog.findMany({
      where: {
        adminId: filter.adminId,
        targetUserId: filter.targetUserId,
        transactionId: filter.transactionId
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination?.skip,
      take: pagination?.take
    });
  }
}
