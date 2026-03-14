import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentSettingsService } from '../../payment-settings.service';
import { CreatePaymentInput, CreatePaymentResult, PaymentProvider, WebhookResult } from './payment-provider';

@Injectable()
export class CmiProvider implements PaymentProvider {
  key: 'CMI' = 'CMI';

  constructor(private readonly paymentSettings: PaymentSettingsService) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const setting = await this.paymentSettings.assertConfigured('CMI', [
      'gatewayUrl',
      'clientId',
      'storeKey',
      'currency',
      'successUrl',
      'failUrl'
    ]);

    const gatewayUrl = String(setting.config.gatewayUrl);
    const clientId = String(setting.config.clientId);
    const storeKey = String(setting.config.storeKey);
    const currency = String(setting.config.currency || input.currency).toUpperCase();
    const okUrl = String(setting.config.successUrl);
    const failUrl = String(setting.config.failUrl);

    const oid = input.walletTransactionId;
    const amount = input.amount.toFixed(2);
    const rnd = `${Date.now()}`;

    const hashPayload = `${clientId}|${oid}|${amount}|${okUrl}|${failUrl}|${rnd}|${storeKey}`;
    const hash = crypto.createHash('sha512').update(hashPayload, 'utf8').digest('base64');

    return {
      provider: 'CMI',
      providerRefId: oid,
      gatewayUrl,
      formFields: {
        clientid: clientId,
        oid,
        amount,
        currency,
        okUrl,
        failUrl,
        rnd,
        hash
      }
    };
  }

  async verifyTransaction(_providerRefId: string) {
    return { status: 'PROCESSING' as const };
  }

  async handleWebhook(input: { rawBody: Buffer; headers: Record<string, string | undefined> }): Promise<WebhookResult> {
    const rawEventType = input.headers['x-event-type'] || 'unknown';
    return { provider: 'CMI', providerRefId: null, walletTransactionId: null, status: 'IGNORED', rawEventType };
  }
}

