'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AlertCircle, Loader2, Plus, Shield } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { StatsCard } from '@/components/stats-card';
import {
  CURRENT_CLIENT_ID, disputesFor, formatRelative, normalizeOrderList,
  ordersForClient,
  type Dispute,
} from '@naqla/shared-utils';

const DISPUTE_REASONS = [
  'جودة الخدمة دون المستوى',
  'تأخّر الإنجاز',
  'خلاف على رسوم إضافية',
  'عدم اكتمال الخدمة',
  'سلوك الموظف',
  'عدم الالتزام بالموعد',
  'أخرى',
];

export default function ClientDisputesPage() {
  // Live disputes (POST /disputes opens, GET /disputes lists the caller's
  // own). Falls back to mock for offline demos.
  type ApiDispute = Dispute & { order?: { orderNumber: string; clientId: string; carrierId?: string } };
  const { data: disputesData, mutate: mutateDisputes } = useSWR<ApiDispute[]>('/disputes', fetcher);
  const myDisputes: ApiDispute[] = useMemo(() => {
    if (Array.isArray(disputesData) && disputesData.length > 0) return disputesData;
    return disputesFor('CLIENT', CURRENT_CLIENT_ID) as ApiDispute[];
  }, [disputesData]);

  // Live orders to populate the "open dispute" form. Only orders that have a
  // carrier on them are eligible (matches backend validation).
  const { data: ordersData } = useSWR<unknown>('/orders', fetcher);
  const myOrders = useMemo(() => {
    const normalized = normalizeOrderList(ordersData);
    if (normalized.length > 0) {
      return normalized.filter((o) => ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(o.status));
    }
    return ordersForClient(CURRENT_CLIENT_ID).filter((o) => ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(o.status));
  }, [ordersData]);

  const open = myDisputes.filter((d) => d.status === 'OPEN').length;
  const review = myDisputes.filter((d) => d.status === 'UNDER_REVIEW').length;
  const resolved = myDisputes.filter((d) => d.status === 'RESOLVED').length;

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ orderId: '', reason: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.orderId || !form.reason || !form.description.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/disputes', {
        orderId: form.orderId,
        reason: form.reason,
        description: form.description.trim(),
      });
      await mutateDisputes();
      notify.success('تم فتح النزاع', 'سيراجعه فريق الدعم خلال 24 ساعة');
      setCreateOpen(false);
      setForm({ orderId: '', reason: '', description: '' });
    } catch (err) {
      notify.error(err, 'فشل فتح النزاع');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="نزاعاتي"
        subtitle="فتح ومتابعة النزاعات المتعلقة بطلباتك"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> فتح نزاع جديد
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="إجمالي النزاعات" value={myDisputes.length} icon={Shield} />
        <StatsCard label="مفتوحة" value={open} icon={AlertCircle} tone="warning" />
        <StatsCard label="قيد المراجعة" value={review} icon={Shield} />
        <StatsCard label="محلولة" value={resolved} icon={Shield} tone="success" />
      </div>

      <Card>
        <CardHeader><CardTitle>قائمة النزاعات</CardTitle></CardHeader>
        <CardContent className="p-0">
          {myDisputes.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-40" />
              لا توجد نزاعات — كل طلباتك تسير بسلاسة 🎉
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم النزاع</TableHead>
                  <TableHead>الطلب</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المُنشِئ</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myDisputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.id}</TableCell>
                    <TableCell>
                      <Link href={`/orders/${d.orderId}`} className="font-mono text-xs text-primary">
                        {d.order?.orderNumber ?? d.orderId}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{d.reason}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">{d.description}</TableCell>
                    <TableCell>
                      <Badge variant={('raisedBy' in d ? d.raisedBy : 'CLIENT') === 'CLIENT' ? 'default' : 'outline'}>
                        {('raisedBy' in d ? d.raisedBy : 'CLIENT') === 'CLIENT' ? 'أنت' : 'المزوّد'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatRelative(d.createdAt)}</TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>فتح نزاع جديد</DialogTitle>
            <DialogDescription>سيتولّى فريق الدعم المراجعة خلال 24 ساعة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>الطلب المُتعلّق</Label>
              <Select value={form.orderId} onValueChange={(v) => setForm({ ...form, orderId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الطلب" /></SelectTrigger>
                <SelectContent>
                  {myOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.orderNumber} — {o.originCity} ← {o.destinationCity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>السبب</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger><SelectValue placeholder="اختر السبب" /></SelectTrigger>
                <SelectContent>
                  {DISPUTE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوصف التفصيلي</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="اشرح المشكلة بتفصيل واضح..."
                className="w-full min-h-[120px] p-3 rounded-md border bg-background text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>إلغاء</Button>
            <Button
              onClick={submit}
              disabled={!form.orderId || !form.reason || !form.description.trim() || submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              فتح النزاع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
