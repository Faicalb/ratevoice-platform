# System Architecture Report

## 1. Tech Stack

### Frontend
- **Framework:** Next.js 16.1.6
- **Language:** TypeScript / React 19
- **Styling:** TailwindCSS 4
- **UI Components:** Shadcn UI, Radix UI, Base UI
- **State/Data:** Axios, SWR (implied), React Hook Form, Zod
- **Real-time:** Socket.io-client
- **Charts:** Recharts
- **Internationalization:** next-intl

### Backend
- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database ORM:** Prisma 7.4.2
- **Database:** PostgreSQL
- **Authentication:** Passport, JWT, Bcrypt
- **Real-time:** Socket.io (Gateway)
- **AI:** Google Generative AI (Gemini)
- **Security:** Helmet, Throttler

## 2. Database Schema (Prisma)

### Core & Auth
- `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `LoginSession`

### Business
- `Business`, `BusinessBranch`, `BusinessVerification`

### Reviews & AI
- `VoiceReview`, `TextReview`, `ReviewReply`, `AIReviewAnalysis`

### Bookings & Payments
- `Booking`, `BookingPayment`

### Wallet & Loyalty
- `Wallet`, `WalletTransaction`, `PointsLedger`, `PointsRule`

### Ads & Marketing
- `AdCampaign`, `Ad`, `AdClick`, `AdAnalytics`

### Content & Engagement
- `Story`, `StoryView`, `StoryReaction`
- `LiveStream`, `LiveStreamViewer`

### Messaging
- `Conversation`, `ConversationParticipant`, `Message`, `MessageAttachment`, `Notification`, `NotificationPreference`

### Ambassador System
- `Ambassador`, `AmbassadorService`, `ServiceOrder`, `EliteLevel`

### Intelligence
- `AIInsight`, `AIMarketReport`, `AIBookingForecast`, `Competitor`, `MarketSignal`

### System
- `SEOPage`, `APIKey`, `ExternalIntegration`, `TrafficLog`, `UsageStatistic`, `AuditLog`, `SecurityEvent`, `FeatureFlag`, `SystemSetting`

### Localization
- `Language`, `BusinessTranslation`, `AppTranslation`, `AIResponseTranslation`

## 3. Services & Modules (Backend)

- **AdsModule:** Campaign management
- **AmbassadorModule:** Referral system
- **AuthModule:** Authentication & Authorization
- **BookingsModule:** Reservation management
- **BusinessModule:** Business profile & settings
- **CompetitorsModule:** Competitor analysis
- **EliteModule:** VIP/Elite status management
- **LivestreamModule:** Live streaming services
- **MessagingModule:** Chat & communications
- **NotificationsModule:** Push & Email notifications
- **PointsModule:** Loyalty points system
- **PrismaModule:** Database connection
- **ReviewsModule:** Review management (Voice/Text)
- **RolesModule:** RBAC
- **SecurityModule:** Audit & Security events
- **SeoModule:** SEO management
- **StoriesModule:** Story content
- **SystemModule:** System configuration
- **UsersModule:** User management
- **WalletModule:** Financial transactions

## 4. Integrations
- **AI:** Google Generative AI
- **Database:** PostgreSQL (via Prisma)
- **Payment:** (Implied via BookingPayment/Wallet - e.g., Stripe)
- **Maps:** (Implied via location fields)

## 5. Status
- **Health:** System appears structurally complete with comprehensive coverage of business requirements.
- **Connections:** Database connection configured via Prisma.
