import { Module } from '@nestjs/common';
import { QrOnboardingService } from './qr-onboarding.service';
import { QrOnboardingController } from './qr-onboarding.controller';

@Module({
  controllers: [QrOnboardingController],
  providers: [QrOnboardingService],
  exports: [QrOnboardingService],
})
export class QrOnboardingModule {}
