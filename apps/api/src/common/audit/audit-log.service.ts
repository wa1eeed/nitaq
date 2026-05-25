import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Append-only audit log. All sensitive actions (auth, money, KYC, settings,
 * uploads, status transitions) MUST go through this service so we have a
 * single immutable trail for compliance & forensics.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async record(entry: AuditEntry) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: (entry.metadata ?? null) as never,
        },
      });
    } catch (err) {
      // Never break the user-facing request because audit logging failed;
      // log loudly so monitoring picks it up.
      this.logger.error(
        `Audit log failed for ${entry.action} (${entry.resourceType})`,
        err as Error,
      );
    }
  }
}
