import { Controller, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('properties/:propertyId/shops/:shopId/payments')
@UseGuards(FirebaseAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('proof')
  @UseGuards(RolesGuard)
  @Roles(Role.TENANT, Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async submitProof(
    @Param('propertyId') propertyId: string,
    @Param('shopId') shopId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.paymentsService.submitProof(propertyId, shopId, dto, req.user);
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async verifyPayment(
    @Param('propertyId') propertyId: string,
    @Param('shopId') shopId: string,
    @Param('id') paymentId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.paymentsService.verifyPayment(propertyId, shopId, paymentId, dto, req.user);
  }
}
