import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export type PaymentProviderKey = 'STRIPE' | 'PAYPAL' | 'CMI' | 'BANK_TRANSFER';

type UpsertSettingInput = {
  provider: PaymentProviderKey;
  enabled: boolean;
  priority: number;
  config: Record<string, any>;
};

@Injectable()
export class PaymentSettingsService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly ivLength = 16;

  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.PAYMENT_SETTINGS_ENCRYPTION_KEY;
    if (!secret) {
      throw new Error('PAYMENT_SETTINGS_ENCRYPTION_KEY is required');
    }
    this.key = crypto.scryptSync(secret, 'salt', 32);
  }

  private isMissingTableError(err: any) {
    const code = err?.code;
    if (code === 'P2021') return true;
    const msg = String(err?.message || '');
    return msg.includes('paymentSetting') || msg.includes('PaymentSetting') || msg.includes('payment_settings');
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private maskConfig(provider: PaymentProviderKey, config: Record<string, any>) {
    const masked = { ...config };

    const secretKeys = new Set<string>([
      'secretKey',
      'webhookSecret',
      'clientSecret',
      'storeKey',
      'supabaseKey'
    ]);

    Object.keys(masked).forEach((k) => {
      if (secretKeys.has(k) && typeof masked[k] === 'string' && masked[k]) {
        masked[k] = '********';
      }
    });

    return { provider, ...masked };
  }

  async getAllAdmin() {
    let rows: any[] = [];
    try {
      rows = await this.prisma.paymentSetting.findMany({ orderBy: { priority: 'asc' } });
    } catch (err) {
      if (this.isMissingTableError(err)) return [];
      throw err;
    }
    return rows.map((r) => {
      const cfg = JSON.parse(this.decrypt(r.configJson));
      return {
        id: r.id,
        provider: r.provider,
        enabled: r.enabled,
        priority: r.priority,
        config: this.maskConfig(r.provider as PaymentProviderKey, cfg)
      };
    });
  }

  async getProvider(provider: PaymentProviderKey) {
    let row: any = null;
    try {
      row = await this.prisma.paymentSetting.findUnique({ where: { provider } });
    } catch (err) {
      if (this.isMissingTableError(err)) return null;
      throw err;
    }
    if (!row) return null;
    return {
      provider: row.provider as PaymentProviderKey,
      enabled: row.enabled,
      priority: row.priority,
      config: JSON.parse(this.decrypt(row.configJson))
    };
  }

  async getEnabledProvidersForCard() {
    let rows: any[] = [];
    try {
      rows = await this.prisma.paymentSetting.findMany({
        where: { enabled: true, provider: { in: ['STRIPE', 'PAYPAL', 'CMI'] } },
        orderBy: { priority: 'asc' }
      });
    } catch (err) {
      if (this.isMissingTableError(err)) return [];
      throw err;
    }

    return rows.map((r) => ({
      provider: r.provider as PaymentProviderKey,
      enabled: r.enabled,
      priority: r.priority,
      config: JSON.parse(this.decrypt(r.configJson))
    }));
  }

  async getBankTransferPublic() {
    let row: any = null;
    try {
      row = await this.prisma.paymentSetting.findUnique({ where: { provider: 'BANK_TRANSFER' } });
    } catch (err) {
      if (this.isMissingTableError(err)) return null;
      throw err;
    }
    if (!row || !row.enabled) return null;
    const cfg = JSON.parse(this.decrypt(row.configJson));
    return {
      enabled: true,
      bankName: cfg.bankName || '',
      accountHolder: cfg.accountHolder || '',
      iban: cfg.iban || '',
      swift: cfg.swift || '',
      instructions: cfg.instructions || ''
    };
  }

  async upsertAdmin(input: UpsertSettingInput) {
    if (!input.provider) throw new BadRequestException('provider is required');
    if (!Number.isFinite(input.priority)) throw new BadRequestException('priority is required');

    let existing: any = null;
    try {
      existing = await this.prisma.paymentSetting.findUnique({ where: { provider: input.provider } });
    } catch (err) {
      if (this.isMissingTableError(err)) {
        throw new BadRequestException('payment_settings table is missing');
      }
      throw err;
    }
    let nextConfig = input.config || {};

    if (existing) {
      const prev = JSON.parse(this.decrypt(existing.configJson));
      nextConfig = this.mergeKeepingSecrets(prev, nextConfig);
    }

    const encrypted = this.encrypt(JSON.stringify(nextConfig));

    return this.prisma.paymentSetting.upsert({
      where: { provider: input.provider },
      create: {
        provider: input.provider,
        enabled: input.enabled,
        priority: input.priority,
        configJson: encrypted
      },
      update: {
        enabled: input.enabled,
        priority: input.priority,
        configJson: encrypted
      }
    });
  }

  private mergeKeepingSecrets(prev: Record<string, any>, next: Record<string, any>) {
    const out = { ...prev, ...next };
    Object.keys(next).forEach((k) => {
      if (typeof next[k] === 'string' && next[k] === '********') {
        out[k] = prev[k];
      }
    });
    return out;
  }

  async assertConfigured(provider: PaymentProviderKey, requiredKeys: string[]) {
    const setting = await this.getProvider(provider);
    if (!setting || !setting.enabled) {
      throw new NotFoundException(`${provider} is not enabled`);
    }
    const missing = requiredKeys.filter((k) => !setting.config?.[k]);
    if (missing.length) {
      throw new BadRequestException(`${provider} missing config: ${missing.join(', ')}`);
    }
    return setting;
  }
}
