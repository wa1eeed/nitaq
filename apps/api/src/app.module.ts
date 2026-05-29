import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { validateEnv } from './config/env.validation';

import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuditModule } from './common/audit/audit.module';
import { HealthController } from './common/health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BidsModule } from './modules/bids/bids.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { SupportModule } from './modules/support/support.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Looks for the environment-specific file then a plain `.env`, both
      // relative to the current working dir AND to the monorepo root. This
      // way the API works whether started from `apps/api/` (direct node run)
      // or from the workspace root (via `pnpm dev` + turbo).
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
        `../../.env.${process.env.NODE_ENV || 'development'}`,
        '../../.env',
      ],
      validate: validateEnv,
    }),

    // Global throttler — 100 req/min per IP. Per-endpoint stricter limits are
    // applied via @Throttle() decorator in individual controllers (login,
    // register, OTP, uploads, admin login, ...).
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60_000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 100),
      },
    ]),

    PrismaModule,
    RedisModule,       // global — provides RedisService
    AuditModule,       // global — provides AuditLogService + AuditInterceptor

    AuthModule,
    UsersModule,
    CompaniesModule,
    OrdersModule,
    BidsModule,
    FleetModule,
    PaymentsModule,
    InvoicesModule,
    NotificationsModule,
    AdminModule,
    DisputesModule,
    SupportModule,
    AddressesModule,
    SettingsModule,
    TrackingModule,
    UploadsModule,
    RealtimeModule,
    ReviewsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: ThrottlerGuard first (cheap, rejects abuse before any work),
    // then JwtAuthGuard.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
