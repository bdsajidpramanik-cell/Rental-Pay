import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { FirebaseModule } from './firebase/firebase.module';
import { UsersModule } from './users/users.module';
import { ShopsModule } from './shops/shops.module';
import { QrOnboardingModule } from './qr-onboarding/qr-onboarding.module';
import { AgreementsModule } from './agreements/agreements.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditInterceptor } from './audit/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FirebaseModule,
    UsersModule,
    ShopsModule,
    QrOnboardingModule,
    AgreementsModule,
    PaymentsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
