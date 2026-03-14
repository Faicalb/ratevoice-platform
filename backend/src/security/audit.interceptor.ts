import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = request;

    return next.handle().pipe(
      tap(async () => {
        if (!user) return; // Only log authenticated actions

        try {
          const action = `${method} ${url}`;
          
          // Determine resource from URL
          const resource = url.split('/')[1] || 'unknown';

          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              action: action,
              resource: resource,
              details: {
                  method,
                  url,
                  ip,
                  // Don't log passwords or sensitive body data
                  body: this.sanitizeBody(body)
              }
            },
          });
        } catch (error) {
          this.logger.error('Failed to create audit log', error);
        }
      }),
    );
  }

  private sanitizeBody(body: any) {
      if (!body) return null;
      const sanitized = { ...body };
      if (sanitized.password) sanitized.password = '[REDACTED]';
      return sanitized;
  }
}
