/**
 * Workflow Engine — single source of truth for order lifecycle transitions,
 * fee calculations, escrow timing, and the notification matrix.
 *
 * All UI surfaces (client order detail, carrier order detail, admin payments,
 * admin disputes) should consult these helpers rather than re-deriving the
 * rules inline. When the backend ships, the same rules move into a NestJS
 * service; the shapes here stay stable so the UI never needs to change.
 *
 * State machine (happy path):
 *
 *   DRAFT ─┬→ PUBLISHED ──→ BIDDING ──→ ASSIGNED ──→ CONFIRMED ──→ IN_TRANSIT
 *          │                                                            │
 *          └→ CANCELLED ←──┴──────────┴──────────┘                      ▼
 *                                                                    DELIVERED
 *                                                                       │
 *                                                                   COMPLETED
 */

import type { OrderStatus, Order, NotificationKind, PickupWindow } from './mock-data';

// ──────────────────────────────────────────────────────────────────────
// Pickup window helpers (the client picks the band; carrier confirms an
// exact time when accepting the bid)
// ──────────────────────────────────────────────────────────────────────

export interface PickupWindowInfo {
  /** 24-hour start hour. */
  startHour: number;
  /** 24-hour end hour. */
  endHour: number;
  /** Arabic label shown in UI. */
  labelAr: string;
  /** English label shown in UI. */
  labelEn: string;
  /** Emoji prefix for compact rows. */
  icon: string;
}

export const PICKUP_WINDOWS: Record<PickupWindow, PickupWindowInfo> = {
  MORNING: { startHour:  8, endHour: 12, labelAr: 'صباحاً',     labelEn: 'Morning',   icon: '🌅' },
  EVENING: { startHour: 12, endHour: 18, labelAr: 'مساءً',      labelEn: 'Evening',   icon: '🌇' },
  ALL_DAY: { startHour:  8, endHour: 18, labelAr: 'طوال اليوم', labelEn: 'All day',   icon: '☀️' },
};

/** Renders e.g. "🌅 صباحاً (8:00 - 12:00)". */
export function pickupWindowLabel(window: PickupWindow, locale: 'ar' | 'en' = 'ar'): string {
  const w = PICKUP_WINDOWS[window];
  const label = locale === 'ar' ? w.labelAr : w.labelEn;
  return `${w.icon} ${label} (${String(w.startHour).padStart(2, '0')}:00 - ${String(w.endHour).padStart(2, '0')}:00)`;
}

/**
 * Given a pickup date + days + optional hours, returns the estimated delivery
 * date as an ISO string. Pure function — no clock dependency, safe for SSR.
 */
export function estimateDeliveryDate(
  pickupDate: Date | string,
  estimatedDays: number,
  estimatedHours: number = 0,
): string {
  const start = new Date(pickupDate);
  const total = estimatedDays * 24 * 3600 * 1000 + estimatedHours * 3600 * 1000;
  return new Date(start.getTime() + total).toISOString();
}

// ──────────────────────────────────────────────────────────────────────
// Cancellation rules
// ──────────────────────────────────────────────────────────────────────

export type CancellationTier = 'FREE' | 'FEE_10_PERCENT' | 'DISPUTE_ONLY' | 'NOT_ALLOWED';

export interface CancellationPolicy {
  tier: CancellationTier;
  /** Fraction of the order total charged as a cancellation penalty (0 if FREE). */
  feeRate: number;
  /** Cancellation amount in SAR (= total × feeRate). */
  feeAmount: number;
  /** What the client gets back (total − feeAmount). */
  refundAmount: number;
  /** When `tier === NOT_ALLOWED`, this explains why; UI can show it directly. */
  blockedReason?: string;
  /** When true, the action should be a "open dispute" button, not "cancel". */
  suggestDispute: boolean;
}

/**
 * Returns the cancellation policy for the given order at its current status.
 * Rules align with the v0.6.0 spec:
 *   - DRAFT / PUBLISHED / BIDDING            → free
 *   - ASSIGNED / CONFIRMED                   → 10% penalty (compensates carrier)
 *   - IN_TRANSIT                             → cancellation not allowed → dispute
 *   - DELIVERED / COMPLETED / CANCELLED      → already terminal
 */
export function cancellationPolicy(order: Pick<Order, 'status' | 'agreedPrice' | 'clientBudget'>): CancellationPolicy {
  const total = order.agreedPrice ?? order.clientBudget ?? 0;

  if (['DRAFT', 'PUBLISHED', 'BIDDING'].includes(order.status)) {
    return { tier: 'FREE', feeRate: 0, feeAmount: 0, refundAmount: total, suggestDispute: false };
  }

  if (['ASSIGNED', 'CONFIRMED'].includes(order.status)) {
    const feeRate = 0.10;
    const feeAmount = total * feeRate;
    return { tier: 'FEE_10_PERCENT', feeRate, feeAmount, refundAmount: total - feeAmount, suggestDispute: false };
  }

  if (order.status === 'IN_TRANSIT') {
    return {
      tier: 'DISPUTE_ONLY',
      feeRate: 0, feeAmount: 0, refundAmount: 0,
      blockedReason: 'الشحنة في الطريق — لا يمكن الإلغاء، افتح نزاعاً لو فيه مشكلة',
      suggestDispute: true,
    };
  }

  return {
    tier: 'NOT_ALLOWED',
    feeRate: 0, feeAmount: 0, refundAmount: 0,
    blockedReason: 'الطلب وصل لحالة نهائية ولا يقبل الإلغاء',
    suggestDispute: false,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Escrow rules
// ──────────────────────────────────────────────────────────────────────

/** Platform commission applied when the carrier receives funds (8%). */
export const COMMISSION_RATE = 0.08;

/** Hours after delivery before the platform auto-releases escrow. */
export const ESCROW_AUTO_RELEASE_HOURS = 72;

export interface EscrowBreakdown {
  /** Total client paid (held in escrow). */
  total: number;
  /** Platform commission (8% of total). */
  commission: number;
  /** Amount the carrier will actually receive. */
  carrierAmount: number;
}

/** Computes the 8/92 split when an order completes. */
export function escrowBreakdown(total: number): EscrowBreakdown {
  const commission = total * COMMISSION_RATE;
  return { total, commission, carrierAmount: total - commission };
}

/**
 * If the order is DELIVERED, returns the milliseconds remaining until the
 * platform auto-releases escrow to the carrier (72h from the delivery
 * timestamp). Returns `null` for orders not in DELIVERED state.
 */
export function escrowAutoReleaseAt(deliveredAt: Date | string | null | undefined): Date | null {
  if (!deliveredAt) return null;
  const d = new Date(deliveredAt);
  return new Date(d.getTime() + ESCROW_AUTO_RELEASE_HOURS * 60 * 60 * 1000);
}

export function escrowMsRemaining(deliveredAt: Date | string | null | undefined, now: Date = new Date()): number | null {
  const releaseAt = escrowAutoReleaseAt(deliveredAt);
  if (!releaseAt) return null;
  return Math.max(0, releaseAt.getTime() - now.getTime());
}

// ──────────────────────────────────────────────────────────────────────
// State transitions
// ──────────────────────────────────────────────────────────────────────

/**
 * Valid forward transitions. Each transition lists who can initiate it.
 * Reverse moves (e.g. un-cancel) are deliberately absent.
 */
export const TRANSITIONS: Record<OrderStatus, { to: OrderStatus; actor: 'CLIENT' | 'CARRIER' | 'ADMIN' | 'SYSTEM' }[]> = {
  DRAFT:      [{ to: 'PUBLISHED', actor: 'CLIENT' }, { to: 'CANCELLED', actor: 'CLIENT' }],
  PUBLISHED:  [{ to: 'BIDDING',   actor: 'SYSTEM' }, { to: 'ASSIGNED', actor: 'CLIENT' }, { to: 'CANCELLED', actor: 'CLIENT' }],
  BIDDING:    [{ to: 'ASSIGNED',  actor: 'CLIENT' }, { to: 'CANCELLED', actor: 'CLIENT' }],
  ASSIGNED:   [{ to: 'CONFIRMED', actor: 'CARRIER' }, { to: 'CANCELLED', actor: 'CLIENT' }],
  CONFIRMED:  [{ to: 'IN_TRANSIT', actor: 'CARRIER' }, { to: 'CANCELLED', actor: 'CLIENT' }],
  IN_TRANSIT: [{ to: 'DELIVERED', actor: 'CARRIER' }],
  DELIVERED:  [{ to: 'COMPLETED', actor: 'CLIENT' }, { to: 'COMPLETED', actor: 'SYSTEM' }], // SYSTEM = auto-release
  COMPLETED:  [],
  CANCELLED:  [],
};

export function canTransition(from: OrderStatus, to: OrderStatus, actor: 'CLIENT' | 'CARRIER' | 'ADMIN' | 'SYSTEM'): boolean {
  return (TRANSITIONS[from] ?? []).some((t) => t.to === to && (t.actor === actor || actor === 'ADMIN'));
}

// ──────────────────────────────────────────────────────────────────────
// Notification matrix
// ──────────────────────────────────────────────────────────────────────

export type Audience = 'admin' | 'client' | 'carrier';

export interface NotificationSpec {
  audience: Audience;
  kind: NotificationKind;
  /** Title template — supports `{var}` placeholders. */
  titleTemplate: string;
  /** Body template — supports `{var}` placeholders. */
  bodyTemplate: string;
}

/**
 * Workflow event → list of notifications that should fire. Used by the mock
 * notification dispatcher (and later the real NotificationsService) to keep
 * the side effects of each transition in one auditable place.
 */
export const NOTIFICATION_MATRIX: Record<string, NotificationSpec[]> = {
  // Client published an order — carriers see a new opportunity
  ORDER_PUBLISHED: [
    { audience: 'carrier', kind: 'NEW_OPPORTUNITY', titleTemplate: 'طلب جديد متاح', bodyTemplate: '{originCity} ← {destinationCity}, {weightKg} كجم' },
  ],

  // Carrier submitted a bid — client sees it
  BID_SUBMITTED: [
    { audience: 'client', kind: 'ORDER_BID', titleTemplate: 'عرض جديد على طلبك', bodyTemplate: '{carrierName} قدّم {price} ر.س' },
  ],

  // Client accepted a bid — winner + losers + admin all notified
  BID_ACCEPTED: [
    { audience: 'carrier', kind: 'ORDER_ACCEPTED', titleTemplate: '✓ تم قبول عرضك', bodyTemplate: 'الطلب {orderNumber} — استعد للاستلام' },
    { audience: 'carrier', kind: 'ORDER_BID',      titleTemplate: '✗ لم يُختر عرضك', bodyTemplate: 'تم قبول عرض آخر على الطلب {orderNumber}' },
    { audience: 'admin',   kind: 'ORDER_ACCEPTED', titleTemplate: 'طلب مُسنَد', bodyTemplate: '{orderNumber} → {carrierName} بقيمة {price} ر.س' },
  ],

  // Carrier confirmed pickup — client + admin
  ORDER_CONFIRMED: [
    { audience: 'client',  kind: 'ORDER_PICKED_UP', titleTemplate: 'تأكيد تحميل البضاعة', bodyTemplate: '{carrierName} بدأ تحميل الطلب {orderNumber}' },
    { audience: 'admin',   kind: 'ORDER_PICKED_UP', titleTemplate: 'انطلاق طلب', bodyTemplate: '{orderNumber}' },
  ],

  // Carrier marked in-transit — client gets ETA
  ORDER_IN_TRANSIT: [
    { audience: 'client', kind: 'ORDER_PICKED_UP', titleTemplate: 'الشحنة في الطريق', bodyTemplate: 'الوصول المتوقّع {estimatedArrival}' },
  ],

  // Carrier marked delivered — client + admin
  ORDER_DELIVERED: [
    { audience: 'client', kind: 'ORDER_DELIVERED', titleTemplate: 'تم تسليم شحنتك', bodyTemplate: 'أكّد الاستلام خلال 72 ساعة لإفراج المبلغ للناقل' },
    { audience: 'admin',  kind: 'ORDER_DELIVERED', titleTemplate: 'طلب مُسلَّم', bodyTemplate: '{orderNumber} — escrow معلَّق' },
  ],

  // Client confirmed receipt OR 72h elapsed — escrow released
  ESCROW_RELEASED: [
    { audience: 'carrier', kind: 'PAYMENT_RELEASED', titleTemplate: 'تم إفراج المبلغ', bodyTemplate: '{carrierAmount} ر.س مُحوَّل لمحفظتك (الطلب {orderNumber})' },
    { audience: 'client',  kind: 'ORDER_DELIVERED',  titleTemplate: 'إغلاق الطلب', bodyTemplate: 'الطلب {orderNumber} مُكتمل' },
  ],

  // Either party cancelled
  ORDER_CANCELLED: [
    { audience: 'client',  kind: 'ORDER_DELIVERED', titleTemplate: 'تم إلغاء الطلب', bodyTemplate: '{orderNumber}{feeMsg}' },
    { audience: 'carrier', kind: 'ORDER_DELIVERED', titleTemplate: 'تم إلغاء طلب', bodyTemplate: '{orderNumber}{compensationMsg}' },
    { audience: 'admin',   kind: 'ORDER_DELIVERED', titleTemplate: 'إلغاء طلب', bodyTemplate: '{orderNumber} — {tier}' },
  ],

  // Either party opened a dispute
  DISPUTE_OPENED: [
    { audience: 'admin',   kind: 'DISPUTE_NEW', titleTemplate: 'نزاع جديد', bodyTemplate: '{orderNumber} — {raisedBy}: {reason}' },
    { audience: 'client',  kind: 'DISPUTE_NEW', titleTemplate: 'فُتح نزاع على طلبك', bodyTemplate: 'سيراجعه فريق نقلة' },
    { audience: 'carrier', kind: 'DISPUTE_NEW', titleTemplate: 'فُتح نزاع على طلب', bodyTemplate: '{orderNumber}' },
  ],

  // Admin resolved a dispute (4 outcomes)
  DISPUTE_RESOLVED: [
    { audience: 'client',  kind: 'DISPUTE_NEW', titleTemplate: 'قرار النزاع', bodyTemplate: '{resolution}' },
    { audience: 'carrier', kind: 'DISPUTE_NEW', titleTemplate: 'قرار النزاع', bodyTemplate: '{resolution}' },
  ],

  // Admin-triggered alerts
  KYC_SUBMITTED: [
    { audience: 'admin', kind: 'KYC_PENDING', titleTemplate: 'طلب اعتماد KYC جديد', bodyTemplate: '{companyName}' },
  ],
  LARGE_TRANSACTION: [
    { audience: 'admin', kind: 'PAYMENT_RELEASED', titleTemplate: 'معاملة كبيرة (> 50,000 ر.س)', bodyTemplate: '{orderNumber} — {amount} ر.س' },
  ],
};

/**
 * Renders a notification spec into a concrete (title, body) pair by substituting
 * `{var}` placeholders. Unknown variables are left as-is for visibility.
 */
export function renderNotification(spec: NotificationSpec, vars: Record<string, string | number>): { title: string; body: string } {
  const subst = (tmpl: string) =>
    tmpl.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
  return { title: subst(spec.titleTemplate), body: subst(spec.bodyTemplate) };
}

/**
 * Convenience: returns the list of notifications that would fire for a given
 * workflow event. The UI can show this in a "what will happen" preview before
 * the user confirms an action.
 */
export function notificationsForEvent(event: keyof typeof NOTIFICATION_MATRIX): NotificationSpec[] {
  return NOTIFICATION_MATRIX[event] ?? [];
}
