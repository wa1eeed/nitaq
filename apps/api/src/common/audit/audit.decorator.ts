import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit:meta';

export interface AuditMeta {
  /** verb-like action — e.g. 'order.publish', 'payment.release', 'kyc.approve' */
  action: string;
  /** resource the action affects — e.g. 'Order', 'Payment', 'Company' */
  resourceType: string;
  /** body or param key that holds the resource id (defaults to 'id') */
  idFrom?: 'param' | 'body' | 'response';
  idKey?: string;
}

/**
 * Mark a controller method to be audited automatically by `AuditInterceptor`.
 *
 * @example
 *   @Audit({ action: 'order.publish', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
 *   @Post(':id/publish')
 *   publish(@Param('id') id: string) { ... }
 */
export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_KEY, meta);
