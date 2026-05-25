'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Loader2, Plus, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { fetcher, api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { DRIVERS, formatDate } from '@naqla/shared-utils';

type Driver = {
  id: string;
  status: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: string;
  totalTrips: number;
  user?: { firstName: string; lastName: string; phone: string };
  // mock shape aliases
  fullName?: string;
  phone?: string;
  nationalId?: string;
};

const LICENSE_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export default function CarrierFleetDrivers() {
  const router = useRouter();
  const [tab, setTab] = useState('ALL');
  const { data, mutate } = useSWR<unknown>('/fleet/drivers', fetcher);

  const all = useMemo(() => {
    const arr =
      Array.isArray(data) ? data :
      Array.isArray((data as { items?: unknown[] })?.items) ? (data as { items: unknown[] }).items :
      [];
    return arr.length > 0 ? arr as Driver[] : DRIVERS as unknown as Driver[];
  }, [data]);

  const counts = useMemo(() => ({
    all: all.length,
    available: all.filter((d) => d.status === 'AVAILABLE').length,
    onTrip: all.filter((d) => d.status === 'ON_TRIP').length,
    offDuty: all.filter((d) => d.status === 'OFF_DUTY').length,
  }), [all]);

  const rows = useMemo(() => (tab === 'ALL' ? all : all.filter((d) => d.status === tab)), [tab, all]);

  // Add driver dialog
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phone: '', nationalId: '',
    licenseNumber: '', licenseExpiry: '', licenseType: 'B',
  });

  const addDriver = async () => {
    if (!form.fullName || !form.phone || !form.licenseNumber || !form.licenseExpiry || saving) return;
    setSaving(true);
    try {
      await api.post('/fleet/drivers/invite', form);
      notify.success('تم إضافة السائق', 'تم إرسال رابط تفعيل الحساب للسائق');
      await mutate();
      setOpen(false);
      setForm({ fullName: '', phone: '', nationalId: '', licenseNumber: '', licenseExpiry: '', licenseType: 'B' });
    } catch (err) {
      notify.error(err, 'فشل إضافة السائق');
    } finally {
      setSaving(false);
    }
  };

  const getName = (d: Driver) =>
    d.fullName ?? [d.user?.firstName, d.user?.lastName].filter(Boolean).join(' ') ?? '—';

  const getPhone = (d: Driver) => d.phone ?? d.user?.phone ?? '—';

  return (
    <>
      <PageHeader
        title="السائقون"
        subtitle={`${counts.all} سائق مسجّل`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة سائق
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ALL">الكل <Badge variant="secondary" className="ms-1">{counts.all}</Badge></TabsTrigger>
          <TabsTrigger value="AVAILABLE">متاح <Badge variant="secondary" className="ms-1">{counts.available}</Badge></TabsTrigger>
          <TabsTrigger value="ON_TRIP">في رحلة <Badge variant="secondary" className="ms-1">{counts.onTrip}</Badge></TabsTrigger>
          <TabsTrigger value="OFF_DUTY">خارج الخدمة <Badge variant="secondary" className="ms-1">{counts.offDuty}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الهوية</TableHead>
                <TableHead>فئة الرخصة</TableHead>
                <TableHead>انتهاء الرخصة</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead className="text-center">رحلات</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    لا يوجد سائقون
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/fleet/drivers/${d.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getName(d).split(' ').slice(0, 2).map((w) => w[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{getName(d)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {(d as unknown as { nationalId?: string }).nationalId ?? '—'}
                    </TableCell>
                    <TableCell>{d.licenseType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.licenseExpiry ? formatDate(d.licenseExpiry) : '—'}
                    </TableCell>
                    <TableCell><span className="font-mono text-xs" dir="ltr">{getPhone(d)}</span></TableCell>
                    <TableCell className="text-center num">{d.totalTrips ?? 0}</TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة سائق جديد</DialogTitle>
            <DialogDescription>سيتم إنشاء حساب للسائق ويُرسَل له رابط التفعيل</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>الاسم الكامل</Label>
              <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="محمد عبدالله الغامدي" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+966 5XX XXX XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهوية (اختياري)</Label>
              <Input dir="ltr" value={form.nationalId} onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))} placeholder="1XXXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم رخصة القيادة</Label>
              <Input dir="ltr" value={form.licenseNumber} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ انتهاء الرخصة</Label>
              <Input type="date" value={form.licenseExpiry} onChange={(e) => setForm((f) => ({ ...f, licenseExpiry: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>فئة الرخصة</Label>
              <Select value={form.licenseType} onValueChange={(v) => setForm((f) => ({ ...f, licenseType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LICENSE_CLASSES.map((c) => <SelectItem key={c} value={c}>فئة {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>إلغاء</Button>
            <Button
              onClick={addDriver}
              disabled={saving || !form.fullName || !form.phone || !form.licenseNumber || !form.licenseExpiry}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
