import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BillStatus,
  Prisma,
  ProofVerificationStatus,
  PaymentMethod,
  User,
} from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tenant submits offline payment proof (Bank / Electricity Office etc.)
   */
  async submitProof(
    propertyId: string,
    shopId: string,
    dto: {
      billId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      referenceNumber?: string;
      fileUrl: string;
      fileType: string;
      notes?: string;
    },
    user: User,
  ) {
    const bill = await this.prisma.bill.findFirst({
      where: { id: dto.billId, propertyId, shopId },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('This bill is already paid');
    }

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

      await tx.bill.update({
        where: { id: bill.id },
        data: { status: BillStatus.PROOF_SUBMITTED },
      });

      return payment;
    });
  }

  /**
   * Owner/Manager verifies or rejects a payment proof
   */
  async verifyPayment(
    propertyId: string,
    shopId: string,
    paymentId: string,
    dto: {
      status: ProofVerificationStatus;
      rejectionReason?: string;
    },
    user: User,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, propertyId, shopId },
      include: { paymentProof: true, bill: true },
    });

    if (!payment?.paymentProof) {
      throw new NotFoundException('Payment proof not found');
    }

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
        // Create receipt
        await tx.receipt.create({
          data: {
            propertyId,
            shopId,
            paymentId: payment.id,
            receiptNumber: `RP-\( {Date.now()}- \){crypto
              .randomBytes(3)
              .toString('hex')
              .toUpperCase()}`,
            amount: payment.amount,
          },
        });

        // Check if full amount is paid
        const verifiedPayments = await tx.payment.findMany({
          where: {
            billId: payment.billId,
            paymentProof: {
              verificationStatus: ProofVerificationStatus.VERIFIED,
            },
          },
        });

        const totalPaid = verifiedPayments.reduce(
          (sum, p) => sum.plus(p.amount),
          new Prisma.Decimal(0),
        );

        if (totalPaid.greaterThanOrEqualTo(payment.bill.amount)) {
          await tx.bill.update({
            where: { id: payment.billId },
            data: { status: BillStatus.PAID },
          });
        }
      } else {
        await tx.bill.update({
          where: { id: payment.billId },
          data: { status: BillStatus.REJECTED },
        });
      }
    });
  }

  /**
   * Owner/Manager records a Cash payment
   */
  async recordCashPayment(
    propertyId: string,
    shopId: string,
    dto: {
      billId: string;
      amount: number;
      referenceNumber?: string;
      notes?: string;
    },
    user: User,
  ) {
    const bill = await this.prisma.bill.findFirst({
      where: { id: dto.billId, propertyId, shopId },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('This bill is already paid');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          propertyId,
          shopId,
          billId: bill.id,
          tenantId: bill.tenantId,
          recordedById: user.id,
          amount: new Prisma.Decimal(dto.amount),
          paymentMethod: PaymentMethod.CASH,
          referenceNumber: dto.referenceNumber || `CASH-${Date.now()}`,
        },
      });

      // Auto create receipt for cash
      await tx.receipt.create({
        data: {
          propertyId,
          shopId,
          paymentId: payment.id,
          receiptNumber: `RP-CASH-\( {Date.now()}- \){crypto
            .randomBytes(2)
            .toString('hex')
            .toUpperCase()}`,
          amount: payment.amount,
        },
      });

      // Mark bill as PAID if full amount received
      if (new Prisma.Decimal(dto.amount).greaterThanOrEqualTo(bill.amount)) {
        await tx.bill.update({
          where: { id: bill.id },
          data: { status: BillStatus.PAID },
        });
      }

      return payment;
    });
  }
}
