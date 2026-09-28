import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ShopStatus } from '@prisma/client';

@Controller('properties/:propertyId/shops')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.OWNER)
  async create(@Param('propertyId') propertyId: string, @Body() dto: any) {
    return this.shopsService.create(propertyId, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.VIEWER)
  async findAll(@Param('propertyId') propertyId: string, @Query('status') status?: ShopStatus) {
    return this.shopsService.findAll(propertyId, status);
  }

  @Get(':shopId')
  @Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.VIEWER)
  async findOne(@Param('propertyId') propertyId: string, @Param('shopId') shopId: string) {
    return this.shopsService.findOne(propertyId, shopId);
  }
}
