import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async syncFirebaseUser(decodedToken: admin.auth.DecodedIdToken, dto: any): Promise<User> {
    const email = decodedToken.email?.toLowerCase();
    if (!email) throw new BadRequestException('Token missing email');

    const [tokenFirst = '', ...tokenLast] = (decodedToken.name || '').split(' ');
    return this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        firstName: dto.firstName || tokenFirst || 'New',
        lastName: dto.lastName || tokenLast.join(' ') || 'User',
        phoneNumber: dto.phoneNumber || decodedToken.phone_number || null,
        passwordHash: 'FIREBASE_MANAGED',
        role: Role.VIEWER,
        isActive: true,
        lastLoginAt: new Date(),
      },
      update: { lastLoginAt: new Date() },
    });
  }

  async updateUserRole(targetId: string, newRole: Role, currentUser: User): Promise<User> {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');

    if (currentUser.id === targetId && currentUser.role === Role.SUPER_ADMIN && newRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admins cannot demote themselves to prevent system lockout.');
    }

    if (target.role === Role.SUPER_ADMIN && newRole !== Role.SUPER_ADMIN) {
      const count = await this.prisma.user.count({ where: { role: Role.SUPER_ADMIN, isActive: true } });
      if (count <= 1) throw new ForbiddenException('System requires at least one active Super Admin.');
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: newRole },
    });
  }
}
