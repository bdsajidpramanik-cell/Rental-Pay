import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Shop, ShopStatus, Prisma } from '@prisma/client';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(propertyId: string, dto: any): Promise<Shop> {
    const existing = await this.prisma.shop.findFirst({
      where: { propertyId, shopNumber: dto.shopNumber.trim() },
    });
    if (existing) throw new ConflictException(`Shop "${dto.shopNumber}" already exists in this property`);

    return this.prisma.shop.create({
      data: {
        propertyId,
        shopNumber: dto.shopNumber.trim(),
        floor: dto.floor,
        sizeSqFt: dto.sizeSqFt,
        rentAmount: new Prisma.Decimal(dto.rentAmount),
        status: dto.status ?? ShopStatus.VACANT,
      },
    });
  }

  async findAll(propertyId: string, status?: ShopStatus): Promise<Shop[]> {
    return this.prisma.shop.findMany({
      where: { propertyId, ...(status && { status }) },
      orderBy: [{ floor: 'asc' }, { shopNumber: 'asc' }],
    });
  }

  async findOne(propertyId: string, shopId: string): Promise<Shop> {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, propertyId },
    });
    if (!shop) throw new NotFoundException('Shop not found in this property');
    return shop;
  }
}
