import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, AuditMeta } from './audit.decorator';
import { AuditLogService } from './audit-log.service';

/**
 * Reads `@Audit()` metadata on the handler and writes an AuditLog row after
 * the request resolves successfully. Captures: userId, IP, user-agent, the
 * resolved resourceId, and a redacted snapshot of the body.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private audit: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta | undefined>(AUDIT_KEY, context.getHandler());
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id;
    const ipAddress: string | undefined =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress;
    const userAgent: string | undefined = req.headers['user-agent'];

    return next.handle().pipe(
      tap((response) => {
        const resourceId =
          meta.idFrom === 'response'
            ? (response as { id?: string } | null)?.id
            : meta.idFrom === 'body'
            ? req.body?.[meta.idKey ?? 'id']
            : req.params?.[meta.idKey ?? 'id'];

        // Best-effort fire-and-forget; never blocks the response.
        void this.audit.record({
          userId,
          action: meta.action,
          resourceType: meta.resourceType,
          resourceId: resourceId ?? null,
          ipAddress,
          userAgent,
          metadata: redactBody(req.body),
        });
      }),
    );
  }
}

const REDACT_KEYS = ['password', 'passwordHash', 'token', 'refreshToken', 'otp', 'secret', 'apiKey'];

function redactBody(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    out[k] = REDACT_KEYS.includes(k) ? '[REDACTED]' : v;
  }
  return out;
}
