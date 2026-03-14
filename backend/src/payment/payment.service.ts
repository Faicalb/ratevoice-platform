import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);
  private readonly enabled: boolean;

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia' as any,
      });
      this.enabled = true;
    } else {
      this.enabled = false;
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd', metadata: any = {}) {
    if (!this.enabled) throw new ServiceUnavailableException('Stripe is not configured');

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
      });
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create Payment Intent', error);
      throw error;
    }
  }

  async verifyWebhookSignature(payload: any, signature: string) {
    if (!this.enabled) throw new ServiceUnavailableException('Stripe is not configured');
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }
}
