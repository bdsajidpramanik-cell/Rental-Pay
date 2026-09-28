import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgreementStatus, Prisma, ShopStatus, User } from '@prisma/client';

@Injectable()
export class AgreementsService {
  private readonly transitions: Record<AgreementStatus, AgreementStatus[]> = {
    [AgreementStatus.DRAFT]: [AgreementStatus.ACTIVE, AgreementStatus.ARCHIVED],
    [AgreementStatus.ACTIVE]: [AgreementStatus.EXPIRING, AgreementStatus.EXPIRED, AgreementStatus.TERMINATED],
    [AgreementStatus.EXPIRING]: [AgreementStatus.EXPIRED, AgreementStatus.TERMINATED, AgreementStatus.ACTIVE],
    [AgreementStatus.EXPIRED]: [AgreementStatus.ARCHIVED],
    [AgreementStatus.TERMINATED]: [AgreementStatus.ARCHIVED],
    [AgreementStatus.ARCHIVED]: [],
  };

  constructor(private readonly prisma: PrismaService) {}

  async update(propertyId: string, shopId: string, agreementId: string, dto: any, user: User) {
    const agreement = await this.prisma.agreement.findFirst({ where: { id: agreementId, propertyId, shopId } });
    if (!agreement) throw new NotFoundException('Agreement not found');

    return this.prisma.$transaction(async (tx) => {
      const latest = await tx.agreementVersion.findFirst({
        where: { agreementId },
        orderBy: { versionNumber: 'desc' },
      });
      const nextVersion = (latest?.versionNumber ?? 0) + 1;

      const updated = await tx.agreement.update({
        where: { id: agreementId },
        data: {
          ...(dto.rentAmount && { rentAmount: new Prisma.Decimal(dto.rentAmount) }),
          ...(dto.securityDeposit && { securityDeposit: new Prisma.Decimal(dto.securityDeposit) }),
        },
      });

      await tx.agreementVersion.create({
        data: {
          agreementId,
          versionNumber: nextVersion,
          revisionReason: dto.revisionReason,
          changedById: user.id,
          snapshotData: JSON.parse(JSON.stringify(updated)),
        },
      });

      return updated;
    });
  }

  async transitionStatus(propertyId: string, shopId: string, agreementId: string, nextStatus: AgreementStatus, user: User) {
    const agreement = await this.prisma.agreement.findFirst({ where: { id: agreementId, propertyId, shopId } });
    if (!agreement) throw new NotFoundException('Agreement not found');

    if (!this.transitions[agreement.status]?.includes(nextStatus)) {
      throw new BadRequestException(`Cannot transition from ${agreement.status} to ${nextStatus}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.agreement.update({ where: { id: agreementId }, data: { status: nextStatus } });

      if ([AgreementStatus.TERMINATED, AgreementStatus.ARCHIVED, AgreementStatus.EXPIRED].includes(nextStatus)) {
        await tx.shop.update({ where: { id: shopId }, data: { status: ShopStatus.VACANT } });
        await tx.tenant.updateMany({ where: { id: agreement.tenantId }, data: { isActive: false } });
      }

      return updated;
    });
  }
}
