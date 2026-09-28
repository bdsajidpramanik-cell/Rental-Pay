import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private readonly sensitive = new Set(['password', 'token', 'rawtoken', 'tokenhash', 'authorization']);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const method = req.method.toUpperCase();

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();
    const { propertyId, shopId, id: entityId } = req.params;

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (!req.user?.id) return;
          this.prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: `${method} ${req.baseUrl || req.path}`,
              entityType: this.getEntityType(req.baseUrl || req.path),
              entityId: entityId || data?.id || undefined,
              ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress,
              details: {
                propertyId: propertyId ?? null,
                shopId: shopId ?? null,
                durationMs: Date.now() - startTime,
                payload: this.sanitize(req.body),
              },
            },
          }).catch((e) => this.logger.error(`Audit logging error: ${e.message}`));
        },
      }),
    );
  }

  private getEntityType(path: string): string {
    for (const type of ['payments', 'bills', 'agreements', 'tenants', 'shops', 'properties', 'qr-onboarding']) {
      if (path.includes(type)) return type.toUpperCase().replace('-', '_');
    }
    return 'SYSTEM';
  }

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((i) => this.sanitize(i));
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = this.sensitive.has(k.toLowerCase()) ? '[REDACTED]' : typeof v === 'object' ? this.sanitize(v) : v;
    }
    return out;
  }
}
