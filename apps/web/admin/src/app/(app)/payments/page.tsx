'use client';
import { useState, useMemo } from 'react';
import { ArrowDownRight, RotateCcw, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { notify } from '@/lib/notify';
import { PAYMENTS, companyById, formatDate, type Payment } from '@naqla/shared-utils';

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState('ALL');
  const [releasingId, setReleasingId] = useState<string | null>(null);

  // GET /payments — list of escrow + released payments. Falls back to mock.
  const { data, mutate } = useSWR<unknown>('/payments', fetcher);

  // Admin can force-release a HELD payment to the carrier (overrides the
  // 72h auto-release). Backend: POST /payments/:id/release — atomically
  // flips state HELD → RELEASED and credits the carrier's wallet.
  const release = async (id: string) => {
    if (releasingId) return;
    setReleasingId(id);
    try {
      await api.post(`/payments/${id}/release`, {});
      await mutate();
      notify.success('تم الإفراج', 'حُوّل المبلغ لمحفظة المزوّد');
    } catch (err) {
      notify.error(err, 'فشل الإفراج');
    } finally {
      setReleasingId(null);
    }
  };
  const all: Payment[] = useMemo(() => {
    const arr =
      Array.isArray(data) ? data :
      Array.isArray((data as { items?: unknown[] })?.items) ? (data as { items: unknown[] }).items :
      [];
    return (arr.length > 0 ? arr : PAYMENTS) as Payment[];
  }, [data]);

  const rows = useMemo(
    () => (tab === 'ALL' ? all : all.filter((p) => p.state === tab)),
    [all, tab],
  );

  const totalHeld = all.filter((p) => p.state === 'HELD').reduce((s, p) => s + p.amount, 0);
  const totalReleased = all.filter((p) => p.state === 'RELEASED').reduce((s, p) => s + p.amount, 0);
  const totalCommission = all.reduce((s, p) => s + p.commission, 0);

  return (
    <>
      <PageHeader title="المدفوعات" subtitle="معاملات Escrow، الإفراج، والعمولات" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="محجوز في Escrow"
          value={<Currency amount={totalHeld} />}
          hint={`${PAYMENTS.filter((p) => p.state === 'HELD').length} عملية`}
          icon={ShieldCheck}
          tone="warning"
        />
        <StatsCard
          label="تم الإفراج"
          value={<Currency amount={totalReleased} />}
          hint={`${PAYMENTS.filter((p) => p.state === 'RELEASED').length} عملية`}
          icon={ArrowDownRight}
          tone="success"
        />
        <StatsCard
          label="عمولة المنصة"
          value={<Currency amount={totalCommission} />}
          hint="على كل المعاملات"
          icon={Wallet}
          tone="default"
        />
        <StatsCard
          label="مردود"
          value={PAYMENTS.filter((p) => p.state === 'REFUNDED').length}
          hint="استرداد"
          icon={RotateCcw}
          tone="danger"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ALL">الكل ({PAYMENTS.length})</TabsTrigger>
          <TabsTrigger value="HELD">في Escrow ({PAYMENTS.filter((p) => p.state === 'HELD').length})</TabsTrigger>
          <TabsTrigger value="RELEASED">مفرَج ({PAYMENTS.filter((p) => p.state === 'RELEASED').length})</TabsTrigger>
          <TabsTrigger value="REFUNDED">مردود ({PAYMENTS.filter((p) => p.state === 'REFUNDED').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العملية</TableHead>
                <TableHead>الطلب</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>المزوّد</TableHead>
                <TableHead className="text-end">المبلغ</TableHead>
                <TableHead className="text-end">العمولة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الدفع</TableHead>
                <TableHead className="text-end"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-medium">{p.id}</TableCell>
                  <TableCell className="font-mono text-xs text-primary">{p.orderId}</TableCell>
                  <TableCell>{companyById(p.clientId)?.nameAr ?? '—'}</TableCell>
                  <TableCell>{companyById(p.carrierId)?.nameAr ?? '—'}</TableCell>
                  <TableCell className="text-end"><Currency amount={p.amount} /></TableCell>
                  <TableCell className="text-end"><Currency amount={p.commission} /></TableCell>
                  <TableCell><StatusBadge status={p.state} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.paidAt)}</TableCell>
                  <TableCell className="text-end">
                    {p.state === 'HELD' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => release(p.id)}
                        disabled={releasingId === p.id}
                      >
                        {releasingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        إفراج
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
