import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillStatus, Prisma, ProofVerificationStatus, User } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitProof(propertyId: string, shopId: string, dto: any, user: User) {
    const bill = await this.prisma.bill.findFirst({ where: { id: dto.billId, propertyId, shopId } });
    if (!bill) throw new NotFoundException('Bill not found');

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          propertyId,
          shopId,
          billId: bill.id,
          tenantId: bill.tenantId,
          recordedById: user.id,
          amount: new Prisma.Decimal(dto.amount),
          paymentMethod: dto.paymentMethod,
          referenceNumber: dto.referenceNumber,
        },
      });

      await tx.paymentProof.create({
        data: {
          paymentId: payment.id,
          fileUrl: dto.fileUrl,
          fileType: dto.fileType,
          verificationStatus: ProofVerificationStatus.PENDING,
          notes: dto.notes,
        },
      });

      await tx.bill.update({ where: { id: bill.id }, data: { status: BillStatus.PROOF_SUBMITTED } });
      return payment;
    });
  }

  async verifyPayment(propertyId: string, shopId: string, paymentId: string, dto: any, user: User) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, propertyId, shopId },
      include: { paymentProof: true, bill: true },
    });

    if (!payment?.paymentProof) throw new NotFoundException('Proof not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: { paymentId },
        data: {
          verificationStatus: dto.status,
          verifiedById: user.id,
          verifiedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
      });

      if (dto.status === ProofVerificationStatus.VERIFIED) {
        await tx.receipt.create({
          data: {
            propertyId,
            shopId,
            paymentId: payment.id,
            receiptNumber: `RCT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
            amount: payment.amount,
          },
        });

        const verified = await tx.payment.findMany({
          where: { billId: payment.billId, paymentProof: { verificationStatus: ProofVerificationStatus.VERIFIED } },
        });

        const totalPaid = verified.reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0));
        if (totalPaid.greaterThanOrEqualTo(payment.bill.amount)) {
          await tx.bill.update({ where: { id: payment.billId }, data: { status: BillStatus.PAID } });
        }
      } else {
        await tx.bill.update({ where: { id: payment.billId }, data: { status: BillStatus.REJECTED } });
      }
    });
  }
}
