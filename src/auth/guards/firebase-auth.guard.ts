import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { FirebaseAdminService } from '../../firebase/firebase-admin.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = await this.firebaseAdmin.verifyIdToken(token);
      if (!decoded.email) throw new UnauthorizedException('Token contains no email');

      const user = await this.prisma.user.findUnique({
        where: { email: decoded.email.toLowerCase() },
      });

      if (!user) throw new UnauthorizedException('User account not synced with database');
      if (!user.isActive) throw new ForbiddenException('Account is inactive');

      request.user = user;
      request.firebaseToken = decoded;
      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
