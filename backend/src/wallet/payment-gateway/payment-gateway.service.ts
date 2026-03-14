import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentSettingsService } from '../payment-settings.service';
import { WalletTransactionService } from '../wallet-transaction.service';
import { CmiProvider } from './providers/cmi.provider';
import { PaypalProvider } from './providers/paypal.provider';
import { PaymentProvider, UnifiedPaymentProviderKey } from './providers/payment-provider';
import { StripeProvider } from './providers/stripe.provider';

type CreateCardDepositInput = {
  userId: string;
  amount: number;
  currency?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly providers: Record<UnifiedPaymentProviderKey, PaymentProvider>;
  private readonly paypalProvider: PaypalProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentSettings: PaymentSettingsService,
    private readonly walletTransactions: WalletTransactionService,
    stripeProvider: StripeProvider,
    paypalProvider: PaypalProvider,
    cmiProvider: CmiProvider
  ) {
    this.providers = {
      STRIPE: stripeProvider,
      PAYPAL: paypalProvider,
      CMI: cmiProvider
    };
    this.paypalProvider = paypalProvider;
  }

  async createCardDeposit(input: CreateCardDepositInput) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (input.amount > 100000) throw new BadRequestException('Amount too large');

    const wallet = await this.walletTransactions.ensureWallet(input.userId, (input.currency || 'USD').toUpperCase());
    const currency = (input.currency || wallet.currency || 'USD').toUpperCase();

    const pending = await this.walletTransactions.createPendingTransaction({
      userId: input.userId,
      amount: input.amount,
      currency,
      type: 'DEPOSIT',
      provider: null,
      status: 'PENDING',
      metadata: {
        method: 'CARD',
        ip: input.ip || null,
        userAgent: input.userAgent || null,
        attemptedProviders: []
      }
    });

    const enabled = await this.paymentSettings.getEnabledProvidersForCard();
    const ordered = enabled
      .map((s) => s.provider)
      .filter((p): p is UnifiedPaymentProviderKey => p === 'STRIPE' || p === 'PAYPAL' || p === 'CMI');

    if (!ordered.length) {
      await this.prisma.walletTransaction.update({
        where: { id: pending.id },
        data: { status: 'FAILED', provider: null }
      });
      throw new BadRequestException('Card payments are not available');
    }

    const attemptedProviders: string[] = [];

    for (const providerKey of ordered) {
      attemptedProviders.push(providerKey);
      const provider = this.providers[providerKey];

      try {
        const result = await provider.createPayment({
          userId: input.userId,
          walletTransactionId: pending.id,
          amount: input.amount,
          currency,
          ip: input.ip || null,
          userAgent: input.userAgent || null
        });

        await this.prisma.walletTransaction.update({
          where: { id: pending.id },
          data: {
            provider: providerKey,
            providerRefId: result.providerRefId,
            status: 'PROCESSING',
            metadataJson: JSON.stringify({
              method: 'CARD',
              ip: input.ip || null,
              userAgent: input.userAgent || null,
              attemptedProviders
            })
          }
        });

        return { transactionId: pending.id, currency, ...result };
      } catch (err) {
        this.logger.warn(`Provider ${providerKey} failed for tx ${pending.id}`);
      }
    }

    await this.prisma.walletTransaction.update({
      where: { id: pending.id },
      data: {
        status: 'FAILED',
        fraudFlag: true,
        metadataJson: JSON.stringify({
          method: 'CARD',
          ip: input.ip || null,
          userAgent: input.userAgent || null,
          attemptedProviders
        })
      }
    });

    throw new BadRequestException('Unable to initialize payment');
  }

  async handleStripeWebhook(rawBody: Buffer, headers: Record<string, string | undefined>) {
    const result = await this.providers.STRIPE.handleWebhook({ rawBody, headers });
    return this.applyWebhookResult(result);
  }

  async handlePaypalWebhook(rawBody: Buffer, headers: Record<string, string | undefined>) {
    const result = await this.providers.PAYPAL.handleWebhook({ rawBody, headers });
    return this.applyWebhookResult(result);
  }

  async capturePaypalDeposit(input: { userId: string; walletTransactionId: string; orderId: string }) {
    const txn = await this.prisma.walletTransaction.findUnique({
      where: { id: input.walletTransactionId },
      include: { wallet: true }
    });
    if (!txn || txn.wallet.userId !== input.userId) throw new NotFoundException('Transaction not found');
    if (txn.type !== 'DEPOSIT') throw new BadRequestException('Invalid transaction type');
    if (txn.provider !== 'PAYPAL') throw new BadRequestException('Invalid provider');
    if (txn.status === 'COMPLETED') return { status: 'COMPLETED' };

    const capture = await this.paypalProvider.captureApprovedOrder(input.orderId);
    if (capture.status === 'COMPLETED') {
      await this.walletTransactions.finalizePendingDeposit(txn.id, input.orderId);
      return { status: 'COMPLETED' };
    }

    await this.prisma.walletTransaction.update({
      where: { id: txn.id },
      data: { status: 'PROCESSING', providerRefId: input.orderId }
    });
    return { status: 'PROCESSING' };
  }

  private async applyWebhookResult(result: {
    provider: UnifiedPaymentProviderKey;
    providerRefId: string | null;
    walletTransactionId: string | null;
    status: 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PROCESSING' | 'IGNORED';
    rawEventType: string;
  }) {
    if (result.status === 'IGNORED') return { received: true };

    const txn = await this.resolveTransaction(result.provider, result.walletTransactionId, result.providerRefId);
    if (!txn) return { received: true };

    if (result.status === 'PROCESSING') {
      await this.prisma.walletTransaction.update({
        where: { id: txn.id },
        data: { status: 'PROCESSING', provider: result.provider, providerRefId: result.providerRefId ?? txn.providerRefId }
      });
      return { received: true };
    }

    if (result.status === 'FAILED') {
      await this.prisma.walletTransaction.update({
        where: { id: txn.id },
        data: { status: 'FAILED', provider: result.provider, providerRefId: result.providerRefId ?? txn.providerRefId }
      });
      return { received: true };
    }

    if (result.status === 'COMPLETED') {
      if (txn.type === 'DEPOSIT') {
        await this.walletTransactions.finalizePendingDeposit(txn.id, result.providerRefId ?? txn.providerRefId ?? null);
        return { received: true };
      }
      await this.prisma.walletTransaction.update({
        where: { id: txn.id },
        data: { status: 'COMPLETED' }
      });
      return { received: true };
    }

    if (result.status === 'REFUNDED') {
      if (txn.status === 'REFUNDED') return { received: true };
      if (txn.type === 'DEPOSIT' && txn.status === 'COMPLETED') {
        const wallet = await this.prisma.wallet.findUnique({ where: { id: txn.walletId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        await this.walletTransactions.debitWalletWithCompletedTransaction({
          userId: wallet.userId,
          amount: Number(txn.amount),
          currency: txn.currency || wallet.currency || 'USD',
          type: 'REFUND',
          provider: txn.provider || result.provider,
          referenceId: txn.id
        });
      }

      await this.prisma.walletTransaction.update({
        where: { id: txn.id },
        data: { status: 'REFUNDED' }
      });

      return { received: true };
    }

    return { received: true };
  }

  private async resolveTransaction(
    provider: UnifiedPaymentProviderKey,
    walletTransactionId: string | null,
    providerRefId: string | null
  ) {
    if (walletTransactionId) {
      const txn = await this.prisma.walletTransaction.findUnique({ where: { id: walletTransactionId } });
      if (txn) return txn;
    }

    if (!providerRefId) return null;
    return this.prisma.walletTransaction.findFirst({
      where: { provider, providerRefId }
    });
  }
}
