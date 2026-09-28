import { Controller, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  @UseGuards(FirebaseAuthGuard)
  async syncUser(@Request() req: any, @Body() dto: any) {
    return this.usersService.syncFirebaseUser(req.firebaseToken, dto);
  }

  @Patch(':id/role')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async updateRole(@Param('id') targetId: string, @Body('role') role: Role, @Request() req: any) {
    return this.usersService.updateUserRole(targetId, role, req.user);
  }
}
