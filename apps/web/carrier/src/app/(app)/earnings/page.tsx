'use client';
import { useMemo } from 'react';
import useSWR from 'swr';
import { ArrowDownRight, Calendar, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { PageTransition, FadeItem } from '@/components/page-transition';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import { fetcher } from '@/lib/api';
import {
  CURRENT_CARRIER_ID, companyById, formatDate, normalizePaymentList,
  paymentsForCarrier,
} from '@naqla/shared-utils';

// API includes an `order` relation with embedded client info — we prefer it
// over `companyById` lookups since DB cuids don't match mock IDs.
type ApiPayment = ReturnType<typeof paymentsForCarrier>[number] & {
  order?: { orderNumber?: string; client?: { nameAr?: string } };
  carrierAmount?: number;
  createdAt?: string;
};

export default function CarrierEarningsPage() {
  // GET /payments — role-aware (carrier sees only their own payments).
  // normalizePaymentList aliases Prisma fields (status/totalAmount/
  // commissionAmount) to the mock shape (state/amount/commission) and zeroes
  // out the missing `vat` so arithmetic doesn't produce NaN.
  const { data } = useSWR<unknown>('/payments', fetcher);
  const all = useMemo<ApiPayment[]>(() => {
    const normalized = normalizePaymentList<ApiPayment>(data);
    return normalized.length > 0 ? normalized : (paymentsForCarrier(CURRENT_CARRIER_ID) as ApiPayment[]);
  }, [data]);
  const released = all.filter((p) => p.state === 'RELEASED');
  const held = all.filter((p) => p.state === 'HELD');

  // Carrier-side net = whatever ends up in the carrier's wallet. Prefer the
  // backend's pre-computed `carrierAmount` (Prisma field) when present,
  // otherwise compute from amount − commission − vat (mock data path).
  const carrierNetOf = (p: ApiPayment): number => {
    if (typeof p.carrierAmount === 'number') return p.carrierAmount;
    const amount = p.amount ?? 0;
    const commission = p.commission ?? 0;
    const vat = p.vat ?? 0;
    return amount - commission - vat;
  };
  const totalNet = released.reduce((s, p) => s + carrierNetOf(p), 0);
  const totalPending = held.reduce((s, p) => s + carrierNetOf(p), 0);
  const totalCommission = released.reduce((s, p) => s + (p.commission ?? 0), 0);

  return (
    <PageTransition>
      <FadeItem>
        <PageHeader title="الأرباح" subtitle="تتبّع مدفوعاتك + الإفراج بعد التسليم" />
      </FadeItem>

      <FadeItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="صافي مستلم" value={<Currency amount={totalNet} />} hint={`${released.length} عملية`} icon={ArrowDownRight} tone="success" />
          <StatsCard label="بانتظار التسليم" value={<Currency amount={totalPending} />} hint={`${held.length} في Escrow`} icon={ShieldCheck} tone="warning" />
          <StatsCard label="عمولات المنصة" value={<Currency amount={totalCommission} />} hint="على المكتملة" icon={TrendingUp} tone="default" />
          <StatsCard label="إجمالي الرحلات" value={released.length + held.length} hint="مدفوعة + Escrow" icon={Wallet} tone="default" />
        </div>
      </FadeItem>

      <FadeItem>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>كشف الحركة</CardTitle>
                <CardDescription className="mt-1">جميع المعاملات المالية على حسابك</CardDescription>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                آخر 30 يوماً
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العملية</TableHead>
                  <TableHead>الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead className="text-end">السعر</TableHead>
                  <TableHead className="text-end">العمولة</TableHead>
                  <TableHead className="text-end">صافي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((p) => {
                  // Prefer embedded `order.client.nameAr` (API response) over
                  // looking up by mock id — DB cuids don't match the mock array.
                  // Fall back to companyById only when the embedded relation is
                  // missing (offline mock path).
                  const clientName =
                    p.order?.client?.nameAr
                    ?? (p.clientId ? companyById(p.clientId)?.nameAr : null)
                    ?? '—';
                  // Same idea for the order: show the human-readable order
                  // number rather than the cuid.
                  const orderRef = p.order?.orderNumber ?? p.orderId;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-medium">{p.id}</TableCell>
                      <TableCell className="font-mono text-xs text-primary">{orderRef}</TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell className="text-end"><Currency amount={p.amount ?? 0} /></TableCell>
                      <TableCell className="text-end text-destructive"><Currency amount={-(p.commission ?? 0)} /></TableCell>
                      <TableCell className="text-end font-medium"><Currency amount={carrierNetOf(p)} /></TableCell>
                      <TableCell><StatusBadge status={p.state} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(p.releasedAt ?? p.paidAt ?? p.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeItem>
    </PageTransition>
  );
}
