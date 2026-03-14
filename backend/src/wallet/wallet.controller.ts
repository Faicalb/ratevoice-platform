import { BadRequestException, Body, Controller, Get, Post, Request, UseGuards, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddFundsDto } from './dto/add-funds.dto';
import { RewardDto, TransferDto } from './dto/wallet.dto';
import { CompensateDto } from './dto/compensate.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentGatewayService } from './payment-gateway/payment-gateway.service';
import { PaymentSettingsService } from './payment-settings.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletTransactionService } from './wallet-transaction.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly paymentSettings: PaymentSettingsService,
    private readonly prisma: PrismaService,
    private readonly walletTransactions: WalletTransactionService,
    private readonly storage: StorageService
  ) {}

  @Get()
  async getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.id);
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.walletService.getHistory(req.user.id);
  }

  @Get('payment-options')
  async getPaymentOptions() {
    const cardProviders = await this.paymentSettings.getEnabledProvidersForCard();
    const bankTransfer = await this.paymentSettings.getBankTransferPublic();
    return {
      card: { enabled: cardProviders.length > 0, providers: cardProviders.map((p) => p.provider) },
      bankTransfer: bankTransfer ? bankTransfer : { enabled: false }
    };
  }

  @Post('deposit')
  async addFunds(@Request() req, @Body() addFundsDto: AddFundsDto) {
    const wallet = await this.walletTransactions.ensureWallet(req.user.id, 'USD');
    return this.paymentGateway.createCardDeposit({
      userId: req.user.id,
      amount: addFundsDto.amount,
      currency: wallet.currency,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || null
    });
  }

  @Post('deposit/bank-transfer')
  async createBankTransferDeposit(@Request() req, @Body() addFundsDto: AddFundsDto) {
    const bank = await this.paymentSettings.getBankTransferPublic();
    if (!bank?.enabled) throw new BadRequestException('Bank transfer is not available');

    const wallet = await this.walletTransactions.ensureWallet(req.user.id, 'USD');
    const txn = await this.walletTransactions.createPendingTransaction({
      userId: req.user.id,
      amount: addFundsDto.amount,
      currency: wallet.currency,
      type: 'DEPOSIT',
      provider: 'BANK_TRANSFER',
      status: 'PENDING',
      metadata: { method: 'BANK_TRANSFER' }
    });

    return { transactionId: txn.id, bankTransfer: bank };
  }

  @Post('deposit/bank-transfer/:transactionId/proof')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBankTransferProof(
    @Request() req,
    @Param('transactionId') transactionId: string,
    @UploadedFile() file: any
  ) {
    if (!file) throw new BadRequestException('File is required');

    const txn = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true }
    });
    if (!txn || txn.wallet?.userId !== req.user.id) throw new BadRequestException('Transaction not found');
    if (txn.provider !== 'BANK_TRANSFER') throw new BadRequestException('Invalid transaction provider');
    if (txn.status !== 'PENDING' && txn.status !== 'FLAGGED') throw new BadRequestException('Transaction already processed');

    const url = await this.storage.uploadFile(file, `wallet/bank-transfer/${req.user.id}`);
    if (!url) throw new BadRequestException('Upload failed');

    await this.prisma.walletTransaction.update({
      where: { id: txn.id },
      data: { proofUrl: url, status: 'PENDING' }
    });

    return { success: true, proofUrl: url };
  }

  @Post('paypal/capture')
  async capturePaypal(@Request() req, @Body('walletTransactionId') walletTransactionId: string, @Body('orderId') orderId: string) {
    if (!walletTransactionId || !orderId) throw new BadRequestException('walletTransactionId and orderId are required');
    return this.paymentGateway.capturePaypalDeposit({ userId: req.user.id, walletTransactionId, orderId });
  }

  @Post('reward')
  @Roles('SUPER_ADMIN', 'ADMIN') // Only admins can trigger rewards via this endpoint directly
  async rewardUser(@Request() req, @Body() rewardDto: RewardDto) {
    return this.walletService.rewardUser(req.user.id, rewardDto.userId, rewardDto.amount, rewardDto.reason);
  }

  @Post('transfer')
  async transferPoints(@Request() req, @Body() transferDto: TransferDto) {
    return this.walletService.transferPoints(req.user.id, transferDto.toUserId, transferDto.amount);
  }

  @Post('compensate')
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async compensateCustomer(@Request() req, @Body() dto: CompensateDto) {
    return this.walletService.compensate(req.user.id, dto.userId, dto.amount, dto.reason);
  }
}
