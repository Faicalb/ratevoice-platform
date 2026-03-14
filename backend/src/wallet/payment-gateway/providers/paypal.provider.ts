import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentSettingsService } from '../../payment-settings.service';
import { CreatePaymentInput, CreatePaymentResult, PaymentProvider, WebhookResult } from './payment-provider';

type PayPalMode = 'sandbox' | 'live';

@Injectable()
export class PaypalProvider implements PaymentProvider {
  key: 'PAYPAL' = 'PAYPAL';

  constructor(private readonly paymentSettings: PaymentSettingsService) {}

  private getApiBase(mode: PayPalMode) {
    return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  }

  private getReturnBaseUrl() {
    const origin = process.env.ALLOWED_ORIGINS?.split(',')?.[0]?.trim();
    return origin || 'http://localhost:3001';
  }

  private async getAccessToken(mode: PayPalMode, clientId: string, clientSecret: string) {
    const url = `${this.getApiBase(mode)}/v1/oauth2/token`;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!res.ok) {
      throw new BadRequestException('Unable to authenticate PayPal');
    }
    const json: any = await res.json();
    if (!json.access_token) throw new BadRequestException('Unable to authenticate PayPal');
    return String(json.access_token);
  }

  private async captureOrder(mode: PayPalMode, accessToken: string, orderId: string) {
    const res = await fetch(`${this.getApiBase(mode)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new BadRequestException('PayPal capture failed');
    return res.json();
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const setting = await this.paymentSettings.assertConfigured('PAYPAL', ['clientId', 'secret', 'mode']);
    const mode = String(setting.config.mode).toLowerCase() as PayPalMode;
    const clientId = String(setting.config.clientId);
    const secret = String(setting.config.secret);

    const token = await this.getAccessToken(mode, clientId, secret);

    const returnBase = this.getReturnBaseUrl();
    const returnUrl = `${returnBase}/en/business/settings/wallet?paypal=success&tx=${encodeURIComponent(input.walletTransactionId)}`;
    const cancelUrl = `${returnBase}/en/business/settings/wallet?paypal=cancel&tx=${encodeURIComponent(input.walletTransactionId)}`;

    const res = await fetch(`${this.getApiBase(mode)}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: input.currency.toUpperCase(),
              value: input.amount.toFixed(2)
            },
            custom_id: input.walletTransactionId
          }
        ],
        application_context: {
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl
        }
      })
    });

    if (!res.ok) throw new BadRequestException('PayPal order creation failed');
    const order: any = await res.json();
    const approvalUrl: string | undefined = order?.links?.find((l: any) => l.rel === 'approve')?.href;
    if (!order?.id || !approvalUrl) throw new BadRequestException('PayPal order creation failed');

    return {
      provider: 'PAYPAL',
      providerRefId: String(order.id),
      approvalUrl: String(approvalUrl)
    };
  }

  async verifyTransaction(providerRefId: string) {
    const setting = await this.paymentSettings.assertConfigured('PAYPAL', ['clientId', 'secret', 'mode']);
    const mode = String(setting.config.mode).toLowerCase() as PayPalMode;
    const clientId = String(setting.config.clientId);
    const secret = String(setting.config.secret);

    const token = await this.getAccessToken(mode, clientId, secret);

    const res = await fetch(`${this.getApiBase(mode)}/v2/checkout/orders/${encodeURIComponent(providerRefId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { status: 'FAILED' as const };
    const order: any = await res.json();

    if (order.status === 'COMPLETED') return { status: 'COMPLETED' as const };
    if (order.status === 'APPROVED' || order.status === 'PAYER_ACTION_REQUIRED') return { status: 'PROCESSING' as const };
    if (order.status === 'VOIDED') return { status: 'FAILED' as const };
    return { status: 'PROCESSING' as const };
  }

  async handleWebhook(input: { rawBody: Buffer; headers: Record<string, string | undefined> }): Promise<WebhookResult> {
    const event: any = JSON.parse(input.rawBody.toString('utf8'));
    const eventType = String(event?.event_type || 'unknown');

    const providerRefId: string | null = event?.resource?.id ? String(event.resource.id) : null;
    const walletTransactionId: string | null = event?.resource?.custom_id ? String(event.resource.custom_id) : null;

    if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'CHECKOUT.ORDER.COMPLETED') {
      return { provider: 'PAYPAL', providerRefId, walletTransactionId, status: 'COMPLETED', rawEventType: eventType };
    }

    if (eventType.includes('PAYMENT.CAPTURE.DENIED') || eventType.includes('PAYMENT.CAPTURE.REFUNDED')) {
      const status = eventType.includes('REFUNDED') ? 'REFUNDED' : 'FAILED';
      return { provider: 'PAYPAL', providerRefId, walletTransactionId, status, rawEventType: eventType };
    }

    return { provider: 'PAYPAL', providerRefId, walletTransactionId, status: 'IGNORED', rawEventType: eventType };
  }

  async captureApprovedOrder(orderId: string) {
    const setting = await this.paymentSettings.assertConfigured('PAYPAL', ['clientId', 'secret', 'mode']);
    const mode = String(setting.config.mode).toLowerCase() as PayPalMode;
    const clientId = String(setting.config.clientId);
    const secret = String(setting.config.secret);
    const token = await this.getAccessToken(mode, clientId, secret);
    const captured: any = await this.captureOrder(mode, token, orderId);
    return { status: String(captured?.status || 'UNKNOWN') };
  }
}
