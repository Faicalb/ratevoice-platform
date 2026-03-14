import { Controller, Headers, Post, Req } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentGateway: PaymentGatewayService) {}

  @Post('stripe')
  async stripeWebhook(@Req() req: any, @Headers() headers: Record<string, string | undefined>) {
    const rawBody: Buffer | undefined = req.rawBody;
    return this.paymentGateway.handleStripeWebhook(rawBody || Buffer.from(JSON.stringify(req.body || {})), headers);
  }

  @Post('paypal')
  async paypalWebhook(@Req() req: any, @Headers() headers: Record<string, string | undefined>) {
    const rawBody: Buffer | undefined = req.rawBody;
    return this.paymentGateway.handlePaypalWebhook(rawBody || Buffer.from(JSON.stringify(req.body || {})), headers);
  }
}

