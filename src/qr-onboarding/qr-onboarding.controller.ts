import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { QrOnboardingService } from './qr-onboarding.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('properties/:propertyId/shops/:shopId/qr-onboarding')
@UseGuards(FirebaseAuthGuard)
export class QrOnboardingController {
  constructor(private readonly qrOnboardingService: QrOnboardingService) {}

  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async generateToken(
    @Param('propertyId') propertyId: string,
    @Param('shopId') shopId: string,
    @Request() req: any,
  ) {
    return this.qrOnboardingService.generateToken(propertyId, shopId, req.user);
  }

  @Post('claim')
  async claimToken(
    @Param('propertyId') propertyId: string,
    @Param('shopId') shopId: string,
    @Body('token') token: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.qrOnboardingService.claimToken(propertyId, shopId, token, dto, req.user);
  }
}
