import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentSettingsService } from '../../payment-settings.service';
import { CreatePaymentInput, CreatePaymentResult, PaymentProvider, WebhookResult } from './payment-provider';

@Injectable()
export class StripeProvider implements PaymentProvider {
  key: 'STRIPE' = 'STRIPE';
  private readonly logger = new Logger(StripeProvider.name);
  private readonly clients = new Map<string, Stripe>();

  constructor(private readonly paymentSettings: PaymentSettingsService) {}

  private getClient(secretKey: string) {
    const cached = this.clients.get(secretKey);
    if (cached) return cached;
    const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' as any });
    this.clients.set(secretKey, stripe);
    return stripe;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const setting = await this.paymentSettings.assertConfigured('STRIPE', ['secretKey', 'publishableKey']);
    const secretKey = String(setting.config.secretKey);
    const publishableKey = String(setting.config.publishableKey);

    if (!input.currency) throw new BadRequestException('Currency is required');
    if (!Number.isFinite(input.amount) || input.amount <= 0) throw new BadRequestException('Amount must be positive');

    const stripe = this.getClient(secretKey);

    const intent = await stripe.paymentIntents.create(
      {
        amount: Math.round(input.amount * 100),
        currency: input.currency.toLowerCase(),
        metadata: {
          userId: input.userId,
          walletTransactionId: input.walletTransactionId,
          type: 'WALLET_DEPOSIT'
        },
        automatic_payment_methods: { enabled: true }
      },
      { idempotencyKey: input.walletTransactionId }
    );

    if (!intent.client_secret) {
      this.logger.error(`Stripe PaymentIntent missing client_secret: ${intent.id}`);
      throw new BadRequestException('Unable to initialize payment');
    }

    return {
      provider: 'STRIPE',
      providerRefId: intent.id,
      clientSecret: intent.client_secret,
      publishableKey
    };
  }

  async verifyTransaction(providerRefId: string) {
    const setting = await this.paymentSettings.assertConfigured('STRIPE', ['secretKey']);
    const stripe = this.getClient(String(setting.config.secretKey));
    const intent = await stripe.paymentIntents.retrieve(providerRefId);

    switch (intent.status) {
      case 'succeeded':
        return { status: 'COMPLETED' as const };
      case 'processing':
      case 'requires_action':
      case 'requires_confirmation':
      case 'requires_payment_method':
        return { status: 'PROCESSING' as const };
      case 'canceled':
        return { status: 'FAILED' as const };
      default:
        return { status: 'FAILED' as const };
    }
  }

  async handleWebhook(input: { rawBody: Buffer; headers: Record<string, string | undefined> }): Promise<WebhookResult> {
    const signature = input.headers['stripe-signature'];
    if (!signature) throw new BadRequestException('Missing stripe-signature header');

    const setting = await this.paymentSettings.assertConfigured('STRIPE', ['secretKey', 'webhookSecret']);
    const stripe = this.getClient(String(setting.config.secretKey));

    const event = stripe.webhooks.constructEvent(input.rawBody, signature, String(setting.config.webhookSecret));

    const type = event.type;
    const obj: any = (event.data as any)?.object;
    const providerRefId: string | null = obj?.id || null;
    const walletTransactionId: string | null = obj?.metadata?.walletTransactionId || null;

    if (type === 'payment_intent.succeeded') {
      return { provider: 'STRIPE', providerRefId, walletTransactionId, status: 'COMPLETED', rawEventType: type };
    }

    if (type === 'payment_intent.payment_failed' || type === 'payment_intent.canceled') {
      return { provider: 'STRIPE', providerRefId, walletTransactionId, status: 'FAILED', rawEventType: type };
    }

    if (type === 'charge.refunded') {
      return { provider: 'STRIPE', providerRefId, walletTransactionId, status: 'REFUNDED', rawEventType: type };
    }

    return { provider: 'STRIPE', providerRefId, walletTransactionId, status: 'IGNORED', rawEventType: type };
  }
}

