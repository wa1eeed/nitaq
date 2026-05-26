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
import { DRIVERS } from '@naqla/shared-utils';

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
  jobTitle?: string;
};

const JOB_TITLES = [
  'مهندس',
  'فني',
  'مصمم',
  'مستشار',
  'مطوّر برمجيات',
  'مدير مشروع',
  'محاسب',
  'محلل أعمال',
  'أخرى',
] as const;

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
    onAssignment: all.filter((d) => d.status === 'ON_ASSIGNMENT' || d.status === 'ON_TRIP').length,
    offDuty: all.filter((d) => d.status === 'OFF_DUTY').length,
  }), [all]);

  const rows = useMemo(() => {
    if (tab === 'ALL') return all;
    if (tab === 'ON_ASSIGNMENT') return all.filter((d) => d.status === 'ON_ASSIGNMENT' || d.status === 'ON_TRIP');
    return all.filter((d) => d.status === tab);
  }, [tab, all]);

  // Add employee dialog
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phone: '', nationalId: '', email: '', jobTitle: 'مهندس',
  });

  const addEmployee = async () => {
    if (!form.fullName || !form.phone || saving) return;
    setSaving(true);
    try {
      const farFuture = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await api.post('/fleet/drivers/invite', {
        fullName: form.fullName,
        phone: form.phone,
        nationalId: form.nationalId,
        email: form.email,
        licenseNumber: form.phone,
        licenseExpiry: farFuture,
        licenseType: form.jobTitle,
      });
      notify.success('تم إضافة الموظف', 'تم إرسال رابط تفعيل الحساب للموظف');
      await mutate();
      setOpen(false);
      setForm({ fullName: '', phone: '', nationalId: '', email: '', jobTitle: 'مهندس' });
    } catch (err) {
      notify.error(err, 'فشل إضافة الموظف');
    } finally {
      setSaving(false);
    }
  };

  const getName = (d: Driver) =>
    d.fullName ?? [d.user?.firstName, d.user?.lastName].filter(Boolean).join(' ') ?? '—';

  const getPhone = (d: Driver) => d.phone ?? d.user?.phone ?? '—';

  const getJobTitle = (d: Driver) => d.jobTitle ?? d.licenseType ?? '—';

  return (
    <>
      <PageHeader
        title="الموظفون"
        subtitle={`${counts.all} موظف مسجّل`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة موظف
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ALL">الكل <Badge variant="secondary" className="ms-1">{counts.all}</Badge></TabsTrigger>
          <TabsTrigger value="AVAILABLE">متاح <Badge variant="secondary" className="ms-1">{counts.available}</Badge></TabsTrigger>
          <TabsTrigger value="ON_ASSIGNMENT">في مهمة <Badge variant="secondary" className="ms-1">{counts.onAssignment}</Badge></TabsTrigger>
          <TabsTrigger value="OFF_DUTY">خارج الخدمة <Badge variant="secondary" className="ms-1">{counts.offDuty}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>المسمى الوظيفي</TableHead>
                <TableHead>رقم الهوية</TableHead>
                <TableHead>رقم الجوال</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    لا يوجد موظفون
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
                    <TableCell className="text-sm text-muted-foreground">{getJobTitle(d)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.nationalId ?? '—'}
                    </TableCell>
                    <TableCell><span className="font-mono text-xs" dir="ltr">{getPhone(d)}</span></TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription>سيتم إنشاء حساب للموظف ويُرسَل له رابط التفعيل</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>الاسم الكامل</Label>
              <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="محمد عبدالله الغامدي" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>المسمى الوظيفي</Label>
              <Select value={form.jobTitle} onValueChange={(v) => setForm((f) => ({ ...f, jobTitle: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>رقم الجوال</Label>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+966 5XX XXX XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهوية / الإقامة (اختياري)</Label>
              <Input dir="ltr" value={form.nationalId} onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))} placeholder="1XXXXXXXXX" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>البريد الإلكتروني (اختياري)</Label>
              <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="employee@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>إلغاء</Button>
            <Button
              onClick={addEmployee}
              disabled={saving || !form.fullName || !form.phone}
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
