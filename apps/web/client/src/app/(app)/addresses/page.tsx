'use client';
import { useState } from 'react';
import useSWR from 'swr';
import {
  ArrowDownToLine, ArrowUpFromLine, Loader2, MapPin, Pencil, Phone, Plus, Star, Trash2,
} from 'lucide-react';
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
import { PageHeader } from '@/components/page-header';
import { useAuthStore } from '@/lib/auth-store';
import { fetcher, api } from '@/lib/api';
import { notify } from '@/lib/notify';

type AddressKind = 'PICKUP' | 'DESTINATION' | 'BOTH';

type SavedAddress = {
  id: string;
  companyId: string;
  label: string;
  city: string;
  region?: string | null;
  address: string;
  contactName?: string | null;
  contactPhone?: string | null;
  kind: AddressKind;
  isDefault: boolean;
};

const KIND_META: Record<AddressKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  PICKUP:      { label: 'استلام',  icon: ArrowUpFromLine,   tone: 'bg-info/15 text-info' },
  DESTINATION: { label: 'تسليم',   icon: ArrowDownToLine,   tone: 'bg-success/15 text-success' },
  BOTH:        { label: 'الاثنين', icon: MapPin,            tone: 'bg-primary/10 text-primary' },
};

const SAUDI_CITIES = [
  'الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة المكرمة', 'المدينة المنورة',
  'الطائف', 'تبوك', 'حائل', 'بريدة', 'الجبيل', 'ينبع', 'أبها', 'نجران',
];

const blank = (): Omit<SavedAddress, 'id' | 'companyId'> => ({
  label: '', city: '', region: '', address: '', kind: 'BOTH',
  contactName: '', contactPhone: '', isDefault: false,
});

export default function AddressesPage() {
  const companyId = useAuthStore((s) => s.user?.companyId);
  const { data: list, mutate, isLoading } = useSWR<SavedAddress[]>(
    companyId ? `/companies/${companyId}/addresses` : null,
    fetcher,
  );

  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(blank());
    setOpen(true);
  };

  const openEdit = (a: SavedAddress) => {
    setEditing(a);
    setForm({ label: a.label, city: a.city, region: a.region ?? '', address: a.address,
      kind: a.kind, contactName: a.contactName ?? '', contactPhone: a.contactPhone ?? '', isDefault: a.isDefault });
    setOpen(true);
  };

  const save = async () => {
    if (!companyId || !form.label || !form.city || !form.address || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/companies/${companyId}/addresses/${editing.id}`, form);
        notify.success('تم تحديث العنوان');
      } else {
        await api.post(`/companies/${companyId}/addresses`, form);
        notify.success('تم إضافة العنوان');
      }
      await mutate();
      setOpen(false);
    } catch (err) {
      notify.error(err, 'فشل حفظ العنوان');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: SavedAddress) => {
    if (!companyId) return;
    setDeletingId(a.id);
    try {
      await api.delete(`/companies/${companyId}/addresses/${a.id}`);
      notify.success('تم حذف العنوان');
      await mutate();
    } catch (err) {
      notify.error(err, 'فشل حذف العنوان');
    } finally {
      setDeletingId(null);
    }
  };

  const makeDefault = async (a: SavedAddress) => {
    if (!companyId) return;
    try {
      await api.post(`/companies/${companyId}/addresses/${a.id}/default`, {});
      notify.success('تم تعيينه كعنوان افتراضي');
      await mutate();
    } catch (err) {
      notify.error(err, 'فشل تعيين الافتراضي');
    }
  };

  return (
    <>
      <PageHeader
        title="العناوين المحفوظة"
        subtitle="مواقع الاستلام والتسليم المتكررة — تظهر تلقائياً في نموذج إنشاء الطلب"
        actions={
          <Button onClick={openAdd} disabled={!companyId}>
            <Plus className="h-4 w-4" /> إضافة عنوان
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="h-40 animate-pulse bg-muted/30" /></Card>
          ))}
        </div>
      ) : !list || list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="font-semibold">لا توجد عناوين محفوظة</h3>
            <p className="mt-1 text-sm text-muted-foreground">احفظ عناوينك المتكررة لتسريع إنشاء الطلبات</p>
            <Button onClick={openAdd} className="mt-4">
              <Plus className="h-4 w-4" /> إضافة أول عنوان
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((a) => {
            const meta = KIND_META[a.kind];
            const Icon = meta.icon;
            return (
              <Card key={a.id} className={a.isDefault ? 'border-primary/40' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${meta.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{a.label}</CardTitle>
                        <div className="text-xs text-muted-foreground">{meta.label}</div>
                      </div>
                    </div>
                    {a.isDefault && (
                      <Badge variant="default" className="shrink-0">
                        <Star className="h-3 w-3 me-1 fill-current" /> افتراضي
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium">{a.city}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{a.address}</div>
                    </div>
                  </div>
                  {(a.contactName || a.contactPhone) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                      <Phone className="h-3.5 w-3.5" />
                      {a.contactName && <span className="font-medium">{a.contactName}</span>}
                      {a.contactPhone && <span className="num" dir="ltr">{a.contactPhone}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-2 border-t">
                    {!a.isDefault && (
                      <Button size="sm" variant="ghost" onClick={() => makeDefault(a)}>
                        <Star className="h-3.5 w-3.5" /> اجعله افتراضياً
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(a)}
                      disabled={deletingId === a.id}
                    >
                      {deletingId === a.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</DialogTitle>
            <DialogDescription>اعطِ العنوان اسماً واضحاً ليسهل اختياره لاحقاً</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>الاسم المختصر</Label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="مثال: المستودع الرئيسي" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Select value={form.city} onValueChange={(v) => setForm((f) => ({ ...f, city: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                  <SelectContent>
                    {SAUDI_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v as AddressKind }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTH">استلام وتسليم</SelectItem>
                    <SelectItem value="PICKUP">استلام فقط</SelectItem>
                    <SelectItem value="DESTINATION">تسليم فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>العنوان التفصيلي</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="الحي، الشارع، رقم المبنى..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم المسؤول</Label>
                <Input value={form.contactName ?? ''} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} placeholder="اسم الشخص" />
              </div>
              <div className="space-y-2">
                <Label>الجوال</Label>
                <Input dir="ltr" value={form.contactPhone ?? ''} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="+966 5XX XXX XXXX" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={save} disabled={saving || !form.label || !form.city || !form.address}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'حفظ التغييرات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
