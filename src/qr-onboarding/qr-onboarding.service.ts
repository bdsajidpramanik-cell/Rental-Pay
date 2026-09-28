import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  GoneException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, ShopStatus, Role } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class QrOnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async generateToken(
    propertyId: string,
    shopId: string,
    user: User,
    dto?: { expectedName?: string; expectedPhone?: string; hours?: number },
  ) {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, propertyId },
    });
    if (!shop) throw new NotFoundException('Shop not found in this property');

    if (user.role === Role.OWNER) {
      const property = await this.prisma.property.findFirst({
        where: { id: propertyId, ownerId: user.id },
      });
      if (!property) {
        throw new ForbiddenException('You do not own this property');
      }
    }

    const hours = dto?.hours ?? 24;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.qrOnboardingToken.create({
      data: {
        propertyId,
        shopId,
        tokenHash,
        expiresAt: new Date(Date.now() + hours * 3600000),
        maxAttempts: 2,
        attemptsCount: 0,
        isConsumed: false,
        createdById: user.id,
        expectedName: dto?.expectedName?.trim() || null,
        expectedPhone: this.normalizePhone(dto?.expectedPhone) || null,
      },
    });

    return {
      rawToken,
      qrPayload: JSON.stringify({
        version: 1,
        propertyId,
        shopId,
        token: rawToken,
      }),
      expiresInHours: hours,
    };
  }

  async claimToken(
    propertyId: string,
    shopId: string,
    rawToken: string,
    dto: {
      businessName: string;
      emergencyContact: string;
      fullName?: string;
      phone?: string;
    },
    user: User,
  ) {
    if (!dto.businessName?.trim()) {
      throw new BadRequestException('businessName is required');
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const record = await this.prisma.qrOnboardingToken.findFirst({
      where: { propertyId, shopId, tokenHash },
    });

    if (!record) throw new NotFoundException('Invalid token');

    if (record.attemptsCount >= record.maxAttempts) {
      throw new ForbiddenException(
        'Token permanently invalidated due to brute-force limit (max 2 attempts).',
      );
    }

    await this.prisma.qrOnboardingToken.update({
      where: { id: record.id },
      data: { attemptsCount: { increment: 1 } },
    });

    if (record.isConsumed || new Date() > record.expiresAt) {
      throw new GoneException('Token already consumed or expired');
    }

    // Verification matching
    if (record.expectedName || record.expectedPhone) {
      const submittedName = (dto.fullName || '').trim().toLowerCase();
      const submittedPhone = this.normalizePhone(
        dto.phone || dto.emergencyContact,
      );

      let nameMatch = true;
      let phoneMatch = true;

      if (record.expectedName) {
        const expected = record.expectedName.trim().toLowerCase();
        nameMatch =
          submittedName === expected ||
          submittedName.includes(expected) ||
          expected.includes(submittedName);
      }

      if (record.expectedPhone) {
        phoneMatch =
          submittedPhone === this.normalizePhone(record.expectedPhone);
      }

      if (!nameMatch || !phoneMatch) {
        const remaining = record.maxAttempts - (record.attemptsCount + 1);
        throw new ForbiddenException(
          `Verification failed. Name or phone does not match. Attempts remaining: ${Math.max(0, remaining)}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.qrOnboardingToken.update({
        where: { id: record.id },
        data: { isConsumed: true, consumedAt: new Date() },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { role: Role.TENANT },
      });

      await tx.shop.update({
        where: { id: shopId },
        data: { status: ShopStatus.OCCUPIED },
      });

      return tx.tenant.create({
        data: {
          userId: user.id,
          propertyId,
          shopId,
          businessName: dto.businessName.trim(),
          emergencyContact: dto.emergencyContact || dto.phone || '',
          isActive: true,
        },
      });
    });
  }

  private normalizePhone(phone?: string | null): string {
    if (!phone) return '';
    return phone
      .replace(/[\s\-\(\)]/g, '')
      .replace(/^\+88/, '')
      .replace(/^88/, '');
  }
}
