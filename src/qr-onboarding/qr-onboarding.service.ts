import { Injectable, NotFoundException, ForbiddenException, GoneException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, ShopStatus, Role } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class QrOnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async generateToken(propertyId: string, shopId: string, user: User, hours = 24) {
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
      },
    });

    return { rawToken, qrPayload: JSON.stringify({ version: 1, propertyId, shopId, token: rawToken }) };
  }

  async claimToken(propertyId: string, shopId: string, rawToken: string, dto: any, user: User) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.prisma.qrOnboardingToken.findFirst({ where: { propertyId, shopId, tokenHash } });

    if (!record) throw new NotFoundException('Invalid token');
    if (record.attemptsCount >= record.maxAttempts) {
      throw new ForbiddenException('Token permanently invalidated due to brute-force limit.');
    }

    await this.prisma.qrOnboardingToken.update({
      where: { id: record.id },
      data: { attemptsCount: { increment: 1 } },
    });

    if (record.isConsumed || new Date() > record.expiresAt) {
      throw new GoneException('Token consumed or expired');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.qrOnboardingToken.update({
        where: { id: record.id },
        data: { isConsumed: true, consumedAt: new Date() },
      });
      await tx.user.update({ where: { id: user.id }, data: { role: Role.TENANT } });
      await tx.shop.update({ where: { id: shopId }, data: { status: ShopStatus.OCCUPIED } });

      return tx.tenant.create({
        data: {
          userId: user.id,
          propertyId,
          shopId,
          businessName: dto.businessName,
          emergencyContact: dto.emergencyContact,
          isActive: true,
        },
      });
    });
  }
}
