import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';

const MAP: Record<string, { variant: Variant; label: string }> = {
  // Carrier-facing labels: framed around what the carrier is waiting for.
  DRAFT:        { variant: 'secondary',   label: 'مسودة' },
  // PUBLISHED on carrier side = a brand-new opportunity (no bids yet).
  PUBLISHED:    { variant: 'default',     label: 'جديد' },
  // BIDDING from carrier's view = "I or someone bid; client hasn't decided yet"
  BIDDING:      { variant: 'warning',     label: 'بإنتظار موافقة العميل' },
  ASSIGNED:     { variant: 'warning',     label: 'مُسند' },
  CONFIRMED:    { variant: 'default',     label: 'مؤكد' },
  IN_TRANSIT:   { variant: 'success',     label: 'قيد التنفيذ' },
  DELIVERED:    { variant: 'success',     label: 'تم الإنجاز' },
  COMPLETED:    { variant: 'success',     label: 'مكتمل' },
  CANCELLED:    { variant: 'destructive', label: 'ملغى' },
  DISPUTED:     { variant: 'warning',     label: 'نزاع' },

  PENDING_VERIFICATION: { variant: 'warning',     label: 'بانتظار التحقق' },
  APPROVED:             { variant: 'success',     label: 'معتمد' },
  REJECTED:             { variant: 'destructive', label: 'مرفوض' },
  ACTIVE:               { variant: 'success',     label: 'نشط' },
  SUSPENDED:            { variant: 'destructive', label: 'موقوف' },

  HELD:     { variant: 'warning', label: 'محجوز' },
  RELEASED: { variant: 'success', label: 'مُفرج' },
  REFUNDED: { variant: 'default', label: 'مُسترد' },
  FAILED:   { variant: 'destructive', label: 'فشل' },

  ISSUED:   { variant: 'default',     label: 'صادرة' },
  PAID:     { variant: 'success',     label: 'مدفوعة' },
  OVERDUE:  { variant: 'destructive', label: 'متأخرة' },

  OPEN:         { variant: 'destructive', label: 'مفتوح' },
  UNDER_REVIEW: { variant: 'warning',     label: 'قيد المراجعة' },
  RESOLVED:     { variant: 'success',     label: 'محلول' },
  CLOSED:       { variant: 'secondary',   label: 'مغلق' },

  ACCEPTED:  { variant: 'success', label: 'مقبول' },
  WITHDRAWN: { variant: 'secondary', label: 'مسحوب' },
  EXPIRED:   { variant: 'destructive', label: 'منتهي' },
};

const PULSE_STATUSES = new Set(['PUBLISHED', 'IN_TRANSIT', 'BIDDING', 'ASSIGNED']);

const PULSE_COLOR: Record<string, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  secondary: 'bg-muted-foreground',
  outline: 'bg-foreground',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const m = MAP[status] ?? { variant: 'secondary' as Variant, label: status };
  const showPulse = PULSE_STATUSES.has(status);

  return (
    <Badge variant={m.variant} className="gap-1.5">
      {showPulse && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              PULSE_COLOR[m.variant] ?? 'bg-primary',
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              PULSE_COLOR[m.variant] ?? 'bg-primary',
            )}
          />
        </span>
      )}
      {label ?? m.label}
    </Badge>
  );
}
