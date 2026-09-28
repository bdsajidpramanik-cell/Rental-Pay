import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

/**
 * Ensures:
 * - SUPER_ADMIN → full access
 * - OWNER → only their own properties
 * - TENANT → only properties where they have active tenancy
 * - MANAGER / VIEWER → property must exist (later we add assignment table)
 */
@Injectable()
export class PropertyAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const propertyId = request.params.propertyId;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    // No propertyId in route → skip this guard
    if (!propertyId) return true;

    // Super Admin → full access
    if (user.role === Role.SUPER_ADMIN) return true;

    // Owner → must own the property
    if (user.role === Role.OWNER) {
      const property = await this.prisma.property.findFirst({
        where: { id: propertyId, ownerId: user.id },
      });
      if (!property) {
        throw new ForbiddenException('You do not have access to this property');
      }
      return true;
    }

    // Tenant → must have active tenancy in this property
    if (user.role === Role.TENANT) {
      const tenancy = await this.prisma.tenant.findFirst({
        where: {
          propertyId,
          userId: user.id,
          isActive: true,
        },
      });
      if (!tenancy) {
        throw new ForbiddenException('You are not a tenant of this property');
      }
      return true;
    }

    // MANAGER / VIEWER → for now just check property exists
    // (Later: add ManagerAssignment table for stricter control)
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return true;
  }
}
