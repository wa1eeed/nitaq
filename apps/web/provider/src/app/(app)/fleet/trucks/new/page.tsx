'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Save, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { useTruckTypesStore } from '@/stores/truck-types-store';
import { cn } from '@/lib/utils';

interface FormState {
  name: string;
  serviceType: string;
  description: string;
  basePrice: string;
  coveredCities: string;
  maxConcurrentOrders: string;
  photos: File[];
}

const BLANK: FormState = {
  name: '',
  serviceType: '',
  description: '',
  basePrice: '',
  coveredCities: '',
  maxConcurrentOrders: '1',
  photos: [],
};

export default function NewServicePage() {
  const router = useRouter();
  const serviceTypes = useTruckTypesStore((s) => s.types.filter((t) => t.active));

  const [form, setForm] = useState<FormState>(BLANK);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const onPhotosChange = (files: FileList | null) => {
    if (!files) return;
    set('photos', Array.from(files).slice(0, 5));
  };

  const removePhoto = (i: number) => {
    set('photos', form.photos.filter((_, idx) => idx !== i));
  };

  const validation = {
    name: form.name.trim().length > 0,
    serviceType: !!form.serviceType,
  };
  const isValid = validation.name && validation.serviceType;

  const submit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (const file of form.photos) {
        const presign = await api.post<{ uploadUrl: string; publicUrl: string }>(
          '/uploads/presign',
          { filename: file.name, contentType: file.type, folder: 'services', sizeBytes: file.size },
        );
        await fetch(presign.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        photoUrls.push(presign.data.publicUrl);
      }

      await api.post('/fleet/trucks', {
        plateNumber: form.name.trim(),
        type: form.serviceType,
        capacity: 0,
        description: form.description.trim() || undefined,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        coveredCities: form.coveredCities.trim()
          ? form.coveredCities.split(',').map((c) => c.trim()).filter(Boolean)
          : undefined,
        maxConcurrentOrders: Number(form.maxConcurrentOrders) || 1,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
      });
      notify.success('تم إضافة الخدمة', form.name.trim());
      router.push('/fleet/trucks');
    } catch (err) {
      notify.error(err, 'فشل إضافة الخدمة');
      setSubmitting(false);
    }
  };

  const selectedType = serviceTypes.find((t) => t.id === form.serviceType);

  return (
    <>
      <PageHeader
        title="إضافة خدمة جديدة"
        subtitle="سجّل خدمة جديدة يقدمها مزودك للعملاء"
        actions={
          <Button variant="outline" onClick={() => router.push('/fleet/trucks')}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader><CardTitle>معلومات الخدمة</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="svc-name">اسم الخدمة</Label>
                <Input
                  id="svc-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="مثال: خدمة صيانة شاملة للمعدات"
                />
              </div>

              <div className="space-y-2">
                <Label>نوع الخدمة</Label>
                <Select value={form.serviceType} onValueChange={(v) => set('serviceType', v)}>
                  <SelectTrigger><SelectValue placeholder="اختر النوع..." /></SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="me-2">{t.icon}</span>
                        {t.nameAr}
                        <span className="text-xs text-muted-foreground ms-2" dir="ltr">{t.nameEn}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
                  <span className="text-2xl">{selectedType.icon}</span>
                  <div className="min-w-0">
                    <div className="font-medium">{selectedType.nameAr}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {selectedType.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="svc-desc">وصف الخدمة</Label>
                <textarea
                  id="svc-desc"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-md border bg-background text-sm leading-relaxed resize-none"
                  placeholder="صف ما يميّز خدمتك وكيف تفيد العميل..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & coverage */}
          <Card>
            <CardHeader>
              <CardTitle>السعر والتغطية</CardTitle>
              <CardDescription className="mt-1">جميع الحقول اختيارية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base-price">السعر الابتدائي (ريال)</Label>
                  <Input
                    id="base-price"
                    type="number"
                    inputMode="numeric"
                    value={form.basePrice}
                    onChange={(e) => set('basePrice', e.target.value)}
                    placeholder="0"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-orders">الحد الأقصى للطلبات المتزامنة</Label>
                  <Input
                    id="max-orders"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={form.maxConcurrentOrders}
                    onChange={(e) => set('maxConcurrentOrders', e.target.value)}
                    placeholder="1"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cities">المدن المخدومة</Label>
                <Input
                  id="cities"
                  value={form.coveredCities}
                  onChange={(e) => set('coveredCities', e.target.value)}
                  placeholder="الرياض، جدة، الدمام"
                />
                <p className="text-xs text-muted-foreground">افصل بين المدن بفاصلة</p>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>صور الخدمة والوثائق</CardTitle>
              <CardDescription className="mt-1">حتى 5 ملفات — اختياري</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/30 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">اضغط لرفع الملفات</span>
                <span className="text-xs text-muted-foreground">PNG, JPG, PDF حتى 5 ميغابايت</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => onPhotosChange(e.target.files)}
                />
              </label>
              {form.photos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {form.photos.map((file, i) => (
                    <div key={i} className="relative aspect-video rounded-md border bg-muted/30 grid place-items-center text-xs text-muted-foreground">
                      <span className="truncate px-2">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 end-1 h-6 w-6 grid place-items-center rounded-full bg-destructive text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/fleet/trucks')} disabled={submitting}>إلغاء</Button>
            <Button onClick={submit} disabled={!isValid || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {submitting ? 'جاري الحفظ...' : 'حفظ الخدمة'}
            </Button>
          </div>
        </div>

        {/* Checklist sidebar */}
        <aside>
          <div className="lg:sticky lg:top-24">
            <Card>
              <CardHeader><CardTitle className="text-base">قائمة التحقق</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <CheckRow label="اسم الخدمة" ok={validation.name} />
                <CheckRow label="نوع الخدمة" ok={validation.serviceType} />
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className={cn('h-4 w-4 shrink-0', ok ? 'text-success' : 'text-muted-foreground/30')} />
      <span className={cn(ok ? '' : 'text-muted-foreground')}>{label}</span>
    </div>
  );
}
