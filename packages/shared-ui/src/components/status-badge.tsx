import * as React from 'react';
import { Badge } from './badge';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'secondary' | 'info' | 'violet';

interface StatusMeta { variant: Variant; label: string; }

const STATUS_MAP: Record<string, StatusMeta> = {
  // Orders
  DRAFT:        { variant: 'secondary', label: 'مسودة' },
  PUBLISHED:    { variant: 'info',      label: 'منشور' },
  BIDDING:      { variant: 'violet',    label: 'قيد العروض' },
  ASSIGNED:     { variant: 'warning',   label: 'مُسند' },
  CONFIRMED:    { variant: 'info',      label: 'مؤكد' },
  IN_TRANSIT:   { variant: 'success',   label: 'في الطريق' },
  DELIVERED:    { variant: 'success',   label: 'تم التسليم' },
  COMPLETED:    { variant: 'success',   label: 'مكتمل' },
  CANCELLED:    { variant: 'danger',    label: 'ملغى' },
  DISPUTED:     { variant: 'warning',   label: 'نزاع' },

  // KYC / accounts
  NOT_SUBMITTED:        { variant: 'secondary', label: 'لم يُقدم' },
  PENDING_VERIFICATION: { variant: 'warning',   label: 'بانتظار التحقق' },
  APPROVED:             { variant: 'success',   label: 'معتمد' },
  REJECTED:             { variant: 'danger',    label: 'مرفوض' },
  ACTIVE:               { variant: 'success',   label: 'نشط' },
  SUSPENDED:            { variant: 'danger',    label: 'موقوف' },
  PENDING:              { variant: 'secondary', label: 'انتظار' },

  // Payments / Escrow
  HELD:        { variant: 'warning', label: 'محجوز' },
  RELEASED:    { variant: 'success', label: 'مُفرج' },
  REFUNDED:    { variant: 'info',    label: 'مُسترد' },
  FAILED:      { variant: 'danger',  label: 'فشل' },

  // Invoices
  ISSUED:      { variant: 'info',    label: 'صادرة' },
  PAID:        { variant: 'success', label: 'مدفوعة' },
  OVERDUE:     { variant: 'danger',  label: 'متأخرة' },

  // Disputes
  OPEN:         { variant: 'danger',    label: 'مفتوح' },
  UNDER_REVIEW: { variant: 'warning',   label: 'قيد المراجعة' },
  RESOLVED:     { variant: 'success',   label: 'محلول' },
  CLOSED:       { variant: 'secondary', label: 'مغلق' },

  // Bids
  ACCEPTED:   { variant: 'success',   label: 'مقبول' },
  WITHDRAWN:  { variant: 'secondary', label: 'مسحوب' },
  EXPIRED:    { variant: 'danger',    label: 'منتهي' },

  // Fleet
  AVAILABLE:   { variant: 'success',   label: 'متاح' },
  ON_TRIP:     { variant: 'info',      label: 'في رحلة' },
  OFF_DUTY:    { variant: 'secondary', label: 'خارج الخدمة' },
  MAINTENANCE: { variant: 'warning',   label: 'صيانة' },
};

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const m = STATUS_MAP[status] ?? { variant: 'secondary' as Variant, label: status };
  return <Badge variant={m.variant} className={className}>{label ?? m.label}</Badge>;
}
