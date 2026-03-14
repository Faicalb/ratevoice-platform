export type UnifiedPaymentProviderKey = 'STRIPE' | 'PAYPAL' | 'CMI';

export type CreatePaymentInput = {
  userId: string;
  walletTransactionId: string;
  amount: number;
  currency: string;
  ip?: string | null;
  userAgent?: string | null;
};

export type CreatePaymentResult =
  | {
      provider: 'STRIPE';
      providerRefId: string;
      clientSecret: string;
      publishableKey: string;
    }
  | {
      provider: 'PAYPAL';
      providerRefId: string;
      approvalUrl: string;
    }
  | {
      provider: 'CMI';
      providerRefId: string;
      gatewayUrl: string;
      formFields: Record<string, string>;
    };

export type WebhookResult = {
  provider: UnifiedPaymentProviderKey;
  providerRefId: string | null;
  walletTransactionId: string | null;
  status: 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PROCESSING' | 'IGNORED';
  rawEventType: string;
};

export interface PaymentProvider {
  key: UnifiedPaymentProviderKey;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  verifyTransaction(providerRefId: string): Promise<{
    status: 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PROCESSING';
  }>;

  handleWebhook(input: {
    rawBody: Buffer;
    headers: Record<string, string | undefined>;
  }): Promise<WebhookResult>;
}

