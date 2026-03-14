import { Controller, Post, Body, UseGuards, Request, Headers, BadRequestException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGatewayService } from '../wallet/payment-gateway/payment-gateway.service';
import { WalletTransactionService } from '../wallet/wallet-transaction.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentGateway: PaymentGatewayService,
    private readonly walletTransactions: WalletTransactionService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createPaymentIntent(@Request() req, @Body('amount') amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const wallet = await this.walletTransactions.ensureWallet(req.user.id, 'USD');
    return this.paymentGateway.createCardDeposit({
      userId: req.user.id,
      amount,
      currency: wallet.currency,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || null
    });
  }

  @Post('webhook')
  async handleWebhook(@Req() req: any, @Headers() headers: Record<string, string | undefined>) {
    const rawBody: Buffer | undefined = req.rawBody;
    return this.paymentGateway.handleStripeWebhook(rawBody || Buffer.from(JSON.stringify(req.body || {})), headers);
  }
}
