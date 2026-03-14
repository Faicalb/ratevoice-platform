import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ price: 'asc' }, { name: 'asc' }]
    });
  }

  async getBusinessSubscriptionByOwner(ownerId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId } });
    if (!business) throw new NotFoundException('Business not found');

    const sub = await this.prisma.subscription.findUnique({
      where: { businessId: business.id },
      include: { plan: true }
    });
    return { businessId: business.id, subscription: sub };
  }

  async listBillingHistoryByOwner(ownerId: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId } });
    if (!business) throw new NotFoundException('Business not found');

    const sub = await this.prisma.subscription.findUnique({ where: { businessId: business.id } });
    if (!sub) return [];

    return this.prisma.billingHistory.findMany({
      where: { subscriptionId: sub.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async subscribe(ownerId: string, planCode: string) {
    const business = await this.prisma.business.findFirst({ where: { ownerId } });
    if (!business) throw new NotFoundException('Business not found');

    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan || !plan.isActive) throw new BadRequestException('Plan not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.upsert({
        where: { businessId: business.id },
        create: {
          businessId: business.id,
          planId: plan.id,
          status: plan.price.equals(0) ? 'ACTIVE' : 'PENDING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: plan.interval === 'YEARLY' ? new Date(Date.now() + 365 * 24 * 60 * 60_000) : new Date(Date.now() + 30 * 24 * 60 * 60_000)
        },
        update: {
          planId: plan.id,
          status: plan.price.equals(0) ? 'ACTIVE' : 'PENDING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: plan.interval === 'YEARLY' ? new Date(Date.now() + 365 * 24 * 60 * 60_000) : new Date(Date.now() + 30 * 24 * 60 * 60_000),
          cancelAtPeriodEnd: false
        }
      });

      const invoice = await tx.billingHistory.create({
        data: {
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: plan.currency,
          status: plan.price.equals(0) ? 'PAID' : 'PENDING',
          provider: plan.price.equals(0) ? 'FREE' : 'MANUAL',
          metadata: { planCode: plan.code }
        }
      });

      await tx.auditLog.create({
        data: {
          userId: ownerId,
          action: 'SUBSCRIPTION_CHANGE',
          resource: 'SUBSCRIPTION',
          details: { businessId: business.id, planCode: plan.code, subscriptionId: subscription.id, invoiceId: invoice.id }
        }
      });

      return { subscription, invoice };
    });

    return result;
  }

  async adminListSubscriptions(skip = 0, take = 50) {
    return this.prisma.subscription.findMany({
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      include: { plan: true, business: { select: { id: true, name: true, status: true, ownerId: true } } }
    });
  }

  async adminListSubscriptionInvoices(subscriptionId: string) {
    return this.prisma.billingHistory.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async adminUpdateInvoiceStatus(adminId: string, invoiceId: string, status: 'PAID' | 'FAILED' | 'PENDING') {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.billingHistory.update({
        where: { id: invoiceId },
        data: { status }
      });

      if (status === 'PAID') {
        const subscription = await tx.subscription.findUnique({ where: { id: invoice.subscriptionId } });
        if (subscription) {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: 'ACTIVE' }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_INVOICE_STATUS_UPDATE',
          resource: 'BILLING',
          details: { invoiceId, status }
        }
      });

      return invoice;
    });
  }
}

