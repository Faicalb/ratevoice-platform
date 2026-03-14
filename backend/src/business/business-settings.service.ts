import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBusinessByOwner(ownerId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId },
      include: { branches: true, externalIntegrations: true }
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  private async getJsonSetting(key: string, fallback: any) {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!row) return fallback;
    try {
      return JSON.parse(row.value);
    } catch {
      return fallback;
    }
  }

  private async setJsonSetting(key: string, value: any) {
    await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, type: 'JSON', value: JSON.stringify(value) },
      update: { type: 'JSON', value: JSON.stringify(value) }
    });
  }

  async getSettings(ownerId: string) {
    const business = await this.getBusinessByOwner(ownerId);

    const prefKey = `business:${business.id}:preferences`;
    const brandingKey = `business:${business.id}:branding`;
    const walletKey = `business:${business.id}:wallet_settings`;
    const securityKey = `business:${business.id}:security_settings`;
    const notificationsKey = `business:${business.id}:notifications`;

    const [preferences, branding, wallet, securityExtra, notifications, sessions, employees] = await Promise.all([
      this.getJsonSetting(prefKey, { language: 'en', currency: 'USD', timezone: 'UTC' }),
      this.getJsonSetting(brandingKey, { brandColor: '#7c3aed', brandStyle: 'soft' }),
      this.getJsonSetting(walletKey, { payoutMethod: 'Bank Transfer', accountNumber: '', autoPayout: false }),
      this.getJsonSetting(securityKey, { twoFactorEnabled: false }),
      this.getJsonSetting(notificationsKey, {
        email: { marketing: false, security: true, updates: true },
        push: { newReview: true, newBooking: true, mentions: false }
      }),
      this.prisma.loginSession.findMany({ where: { userId: ownerId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.businessEmployee.findMany({
        where: { businessId: business.id, status: { not: 'REMOVED' } },
        include: { user: { select: { id: true, email: true, fullName: true, phoneNumber: true } }, permissions: true },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const profile = {
      name: business.name,
      email: business.discoveredEmail || '',
      phone: business.branches?.[0]?.phoneNumber || '',
      address: business.branches?.[0]?.address || '',
      website: business.website || '',
      description: business.description || '',
      logo: business.logoUrl || ''
    };

    const security = {
      twoFactorEnabled: !!securityExtra.twoFactorEnabled,
      lastPasswordChange: '',
      loginHistory: sessions.map((s) => ({
        date: s.createdAt.toISOString(),
        ip: s.ipAddress || '',
        device: s.userAgent || ''
      }))
    };

    const integrations = (business.externalIntegrations || []).map((i) => ({
      id: i.id,
      name: i.provider,
      connected: i.isActive,
      icon: ''
    }));

    const team = employees.map((e) => {
      const perms: any = {};
      for (const p of e.permissions) perms[p.key] = !!p.enabled;
      return {
        id: e.id,
        name: e.user.fullName || '',
        email: e.user.email,
        phone: e.user.phoneNumber || '',
        jobTitle: e.roleTitle || '',
        department: '',
        role: 'Manager',
        status: e.status === 'ACTIVE' ? 'Active' : 'Invited',
        accessScope: 'Limited Access',
        permissions: {
          viewReviews: !!perms.view_reviews,
          replyReviews: !!perms.reply_reviews,
          manageBookings: !!perms.manage_bookings,
          accessAnalytics: !!perms.view_analytics,
          manageAds: !!perms.manage_promotions,
          accessWallet: !!perms.manage_wallet,
          sendRewards: !!perms.send_rewards,
          accessReports: !!perms.export_reports,
          manageStaff: !!perms.manage_staff
        },
        security: { require2FA: false, forcePasswordReset: true, sessionTimeout: true }
      };
    });

    return {
      profile,
      security,
      notifications,
      preferences: { ...preferences, ...branding },
      team,
      wallet,
      integrations
    };
  }

  async updateSettings(ownerId: string, section: string, data: any) {
    const business = await this.getBusinessByOwner(ownerId);

    if (section === 'profile') {
      await this.prisma.business.update({
        where: { id: business.id },
        data: {
          name: data.name ?? business.name,
          description: data.description ?? business.description,
          website: data.website ?? business.website
        }
      });
      return { success: true };
    }

    if (section === 'notifications') {
      await this.setJsonSetting(`business:${business.id}:notifications`, data);
      return { success: true };
    }

    const keyMap: Record<string, string> = {
      preferences: `business:${business.id}:preferences`,
      branding: `business:${business.id}:branding`,
      wallet: `business:${business.id}:wallet_settings`,
      security: `business:${business.id}:security_settings`
    };
    const key = keyMap[section];
    if (!key) throw new BadRequestException('Unknown settings section');
    await this.setJsonSetting(key, data);
    return { success: true };
  }
}
