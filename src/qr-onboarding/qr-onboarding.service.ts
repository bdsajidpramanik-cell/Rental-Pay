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

  /**
   * Owner/Manager generates a QR token for a shop.
   * Optional: expectedName + expectedPhone for verification matching.
   */
  async generateToken(
    propertyId: string,
    shopId: string,
    user: User,
    dto?: { expectedName?: string; expectedPhone?: string; hours?: number },
  ) {
    // Shop must belong to this property
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, propertyId },
    });
    if (!shop) throw new NotFoundException('Shop not found in this property');

    // Owner can only generate for their own property
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
        shop
