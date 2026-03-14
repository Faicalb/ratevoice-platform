import { Controller, Get, Post, Body, UseGuards, Request, Query, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionService } from './subscription.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('business/subscription/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async listPlans() {
    return this.subscriptionService.listPlans();
  }

  @Get('business/subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async getSubscription(@Request() req) {
    return this.subscriptionService.getBusinessSubscriptionByOwner(req.user.id);
  }

  @Get('business/subscription/billing-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async getBillingHistory(@Request() req) {
    return this.subscriptionService.listBillingHistoryByOwner(req.user.id);
  }

  @Post('business/subscription/subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'ADMIN', 'SUPER_ADMIN')
  async subscribe(@Request() req, @Body() dto: SubscribeDto) {
    return this.subscriptionService.subscribe(req.user.id, dto.planCode);
  }

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminList(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.subscriptionService.adminListSubscriptions(Number(skip || 0), Number(take || 50));
  }

  @Get('admin/subscriptions/:id/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminInvoices(@Param('id') id: string) {
    return this.subscriptionService.adminListSubscriptionInvoices(id);
  }

  @Patch('admin/billing/invoices/:invoiceId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminUpdateInvoice(@Request() req, @Param('invoiceId') invoiceId: string, @Body('status') status: 'PAID' | 'FAILED' | 'PENDING') {
    return this.subscriptionService.adminUpdateInvoiceStatus(req.user.id, invoiceId, status);
  }
}

