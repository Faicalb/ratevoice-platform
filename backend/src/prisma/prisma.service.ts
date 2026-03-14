// @ts-nocheck
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const logger = new Logger(PrismaService.name);
    const originalUrl = process.env.DATABASE_URL || '';
    let connectionString = originalUrl;

    // Check for Sandbox Environment
    if (process.env.APP_ENV === 'sandbox') {
        const hasQuery = originalUrl.includes('?');
        connectionString = hasQuery 
          ? `${originalUrl}&schema=sandbox` 
          : `${originalUrl}?schema=sandbox`;
        
        logger.warn('Sandbox database schema enabled');
    }

    const pool = new Pool({ 
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
