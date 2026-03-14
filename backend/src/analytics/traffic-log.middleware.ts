import { Injectable, NestMiddleware } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrafficLogMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  use(req: any, res: any, next: () => void) {
    const started = Date.now();
    res.on('finish', async () => {
      try {
        const durationMs = Date.now() - started;
        const path = String(req.originalUrl || req.url || '');
        if (!path.startsWith('/api/v1')) return;
        await this.prisma.trafficLog.create({
          data: {
            path,
            method: String(req.method || ''),
            statusCode: Number(res.statusCode || 0),
            ipAddress: req.ip || null,
            userAgent: req.headers?.['user-agent'] ? String(req.headers['user-agent']) : null,
            timestamp: new Date()
          }
        });
        void durationMs;
      } catch {}
    });
    next();
  }
}

