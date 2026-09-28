import { Controller, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, AgreementStatus } from '@prisma/client';

@Controller('properties/:propertyId/shops/:shopId/agreements')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.OWNER)
  async update(
    @Param('propertyId') propertyId: string,
    @Param('shopId') shopId: string,
    @Param('id') agreementId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.agreementsService.update(propertyId, shopId, agreementId, dto, req.user);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.OWNER)
  async transitionStatus(
    @Param('propertyId') propertyId: string,
    @Param('shopId') shopId: string,
    @Param('id') agreementId: string,
    @Body('status') nextStatus: AgreementStatus,
    @Request() req: any,
  ) {
    return this.agreementsService.transitionStatus(propertyId, shopId, agreementId, nextStatus, req.user);
  }
}
