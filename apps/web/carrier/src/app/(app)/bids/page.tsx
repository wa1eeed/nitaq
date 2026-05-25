'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Clock, Gavel, Search, TrendingUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { PageTransition, FadeItem } from '@/components/page-transition';
import { StatsCard } from '@/components/stats-card';
import { Currency } from '@/components/currency';
import {
  CURRENT_CARRIER_ID, ORDERS, bidsForCarrier, formatRelative,
  type Bid,
} from '@naqla/shared-utils';

const STATUS_LABELS: Record<Bid['status'], string> = {
  PENDING: 'في الانتظار', ACCEPTED: 'مقبول', REJECTED: 'مرفوض',
  WITHDRAWN: 'مسحوب', EXPIRED: 'منتهٍ',
};
const STATUS_BADGE: Record<Bid['status'], 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  PENDING: 'warning', ACCEPTED: 'success', REJECTED: 'destructive',
  WITHDRAWN: 'outline', EXPIRED: 'outline',
};

export default function CarrierBidsPage() {
  const bids = bidsForCarrier(CURRENT_CARRIER_ID);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return bids.filter((b) => {
      if (status !== 'ALL' && b.status !== status) return false;
      if (q) {
        const order = ORDERS.find((o) => o.id === b.orderId);
        const hay = `${b.id} ${b.orderId} ${order?.originCity ?? ''} ${order?.destinationCity ?? ''}`;
        if (!hay.toLowerCase().includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [bids, q, status]);

  const total = bids.length;
  const accepted = bids.filter((b) => b.status === 'ACCEPTED').length;
  const pending = bids.filter((b) => b.status === 'PENDING').length;
  const winRate = total > 0 ? (accepted / total) * 100 : 0;

  return (
    <PageTransition>
      <FadeItem>
        <PageHeader
          title="سجل العروض"
          subtitle="كل العروض التي قدّمتها على فرص النقل — مقبولة، معلّقة، أو مرفوضة"
        />
      </FadeItem>

      <FadeItem>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="إجمالي العروض" value={total.toLocaleString('en-US')} icon={Gavel} />
          <StatsCard label="مقبولة"        value={accepted.toLocaleString('en-US')} icon={Check} tone="success" />
          <StatsCard label="بانتظار الرد"  value={pending.toLocaleString('en-US')} icon={Clock} tone="warning" />
          <StatsCard label="نسبة الفوز"    value={`${winRate.toFixed(0)}%`}        icon={TrendingUp} hint="من إجمالي العروض" />
        </div>
      </FadeItem>

      <FadeItem>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم العرض، الطلب، أو المسار..." className="pe-10" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل الحالات</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العرض</TableHead>
                  <TableHead>الطلب</TableHead>
                  <TableHead>المسار</TableHead>
                  <TableHead className="text-end">السعر</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>الملاحظات</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      <X className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      لا توجد عروض مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => {
                    const order = ORDERS.find((o) => o.id === b.orderId);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.id}</TableCell>
                        <TableCell>
                          <Link href={`/orders/${b.orderId}`} className="font-mono text-xs text-primary">{b.orderId}</Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {order ? `${order.originCity} ← ${order.destinationCity}` : '—'}
                        </TableCell>
                        <TableCell className="text-end font-medium"><Currency amount={b.price} /></TableCell>
                        <TableCell className="num text-sm">{b.estimatedDays} {b.estimatedDays === 1 ? 'يوم' : 'أيام'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{b.notes ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatRelative(b.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeItem>
    </PageTransition>
  );
}
