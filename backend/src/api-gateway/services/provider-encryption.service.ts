import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ProviderEncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly ivLength = 16;
  private readonly logger = new Logger(ProviderEncryptionService.name);

  constructor() {
    const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
    const secret = process.env.PROVIDER_ENCRYPTION_KEY;
    if (!secret) {
      if (env === 'production') {
        throw new Error('PROVIDER_ENCRYPTION_KEY is required');
      }
      this.logger.warn('PROVIDER_ENCRYPTION_KEY is not set; using a development-only fallback');
    }
    const effectiveSecret = secret || 'dev-only-fallback-secret';
    this.key = crypto.scryptSync(effectiveSecret, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(text: string): string {
    try {
      const [ivHex, encryptedHex] = text.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt API key');
      return '';
    }
  }
}
