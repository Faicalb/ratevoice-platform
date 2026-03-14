import { Module, Global } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditInterceptor } from './audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AdminSecurityAlertsController } from './admin-security-alerts.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SecurityController, AdminSecurityAlertsController],
  providers: [
      SecurityService,
      {
          provide: APP_INTERCEPTOR,
          useClass: AuditInterceptor
      }
  ],
  exports: [SecurityService]
})
export class SecurityModule {}
