import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { BusinessModule } from './business/business.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BookingsModule } from './bookings/bookings.module';
import { WalletModule } from './wallet/wallet.module';
import { PointsModule } from './points/points.module';
import { AdsModule } from './ads/ads.module';
import { StoriesModule } from './stories/stories.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AmbassadorModule } from './ambassador/ambassador.module';
import { EliteModule } from './elite/elite.module';
import { AiAnalyticsModule } from './ai-analytics/ai-analytics.module';
import { CompetitorsModule } from './competitors/competitors.module';
import { SeoModule } from './seo/seo.module';
import { ApiIntegrationModule } from './api-integration/api-integration.module';
import { SecurityModule } from './security/security.module';
import { SystemModule } from './system/system.module';
import { StorageModule } from './storage/storage.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { TerminusModule } from '@nestjs/terminus';
import { PaymentModule } from './payment/payment.module';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SystemHealthModule } from './system-health/system-health.module';
import { GlobalDataEngineModule } from './global-data-engine/global-data-engine.module';
import { ReviewImportAiModule } from './review-import-ai/review-import-ai.module';
import { FraudDetectionModule } from './fraud-detection/fraud-detection.module';
import { SeoIntelligenceModule } from './seo-intelligence/seo-intelligence.module';
import { TrafficLogMiddleware } from './analytics/traffic-log.middleware';
import { SubscriptionModule } from './subscription/subscription.module';
import { EmployeeModule } from './employee/employee.module';
import { NewsModule } from './news/news.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 1. Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // Increased for production load
    }]),
    // 2. Caching (Redis)
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 1 minute default
      max: 1000,
      // store: redisStore, // Uncomment in production with Redis URL
      // host: process.env.REDIS_HOST || 'localhost',
      // port: parseInt(process.env.REDIS_PORT) || 6379,
    }),
    // 3. Job Queue (Redis)
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379') || 6379,
      },
    }),
    // 4. Health Checks
    TerminusModule,
    
    // Core Modules
    PrismaModule, AuthModule, UsersModule, RolesModule, BusinessModule, 
    ReviewsModule, BookingsModule, WalletModule, PointsModule, AdsModule, 
    StoriesModule, MessagingModule, NotificationsModule, 
    AmbassadorModule, EliteModule, AiAnalyticsModule, CompetitorsModule, 
    SeoModule, ApiIntegrationModule, SecurityModule, SystemModule, 
    StorageModule, AdminModule, 
    
    // New Modules
    AnalyticsModule,
    IntegrationsModule,
    PaymentModule, QueueModule, HealthModule, ApiGatewayModule, SystemHealthModule,
    GlobalDataEngineModule, ReviewImportAiModule, FraudDetectionModule, SeoIntelligenceModule,
    SubscriptionModule, EmployeeModule
    , NewsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TrafficLogMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TrafficLogMiddleware).forRoutes('*');
  }
}
