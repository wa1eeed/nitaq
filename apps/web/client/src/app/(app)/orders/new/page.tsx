'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { api } from '@/lib/api';

const SERVICE_OPTIONS = [
  { value: 'CONSULTING',        label: 'استشارات' },
  { value: 'DESIGN',            label: 'تصميم' },
  { value: 'INSTALLATION',      label: 'تركيب وتنصيب' },
  { value: 'MAINTENANCE',       label: 'صيانة' },
  { value: 'TECHNICAL_SUPPORT', label: 'دعم تقني' },
  { value: 'TRAINING',          label: 'تدريب' },
  { value: 'IT_SERVICES',       label: 'خدمات تقنية' },
  { value: 'LOGISTICS',         label: 'لوجستيات' },
  { value: 'PROJECT_MANAGEMENT',label: 'إدارة مشاريع' },
  { value: 'OTHER',             label: 'أخرى' },
];

const CITY_OPTIONS = [
  'الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الأحساء',
  'تبوك','بريدة','أبها','خميس مشيط','حائل','نجران','الطائف','ينبع',
];

interface FormData {
  cargoType: string;
  cargoDescription: string;
  city: string;
  pickupDate: string;
  requiredServiceType: string;
  specialInstructions: string;
}

const STEPS = ['تفاصيل الخدمة', 'الموقع والموعد', 'مراجعة وإرسال'];

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    cargoType: 'CONSULTING',
    cargoDescription: '',
    city: 'الرياض',
    pickupDate: '',
    requiredServiceType: 'CONSULTING',
    specialInstructions: '',
  });

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const step0Valid = form.cargoType && form.cargoDescription.trim().length >= 4;
  const step1Valid = form.city && form.pickupDate;
  const canProceed = step === 0 ? step0Valid : step === 1 ? step1Valid : true;

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        mode: 'OPEN',
        cargoType: form.cargoType,
        cargoDescription: form.cargoDescription.trim(),
        originCity: form.city,
        originRegion: form.city,
        originAddress: form.city,
        destinationCity: form.city,
        destinationRegion: form.city,
        destinationAddress: form.city,
        requiredServiceType: form.requiredServiceType,
        requiresInsurance: false,
        pickupDate: form.pickupDate,
        pickupWindow: 'ALL_DAY',
        ...(form.specialInstructions.trim()
          ? { specialInstructions: form.specialInstructions.trim() }
          : {}),
      };

      const createRes = await api.post('/orders', body);
      const created = createRes.data?.data ?? createRes.data;
      const orderId: string | undefined = created?.id;
      if (!orderId) throw new Error('لم يُعَد orderId من الـ API');

      try {
        await api.post(`/orders/${orderId}/publish`, {});
      } catch (publishErr: unknown) {
        const msg = publishErr instanceof Error ? publishErr.message : String(publishErr);
        setError(`الطلب أُنشئ لكن فشل نشره: ${msg}`);
        setSubmitting(false);
        router.push(`/orders/${orderId}`);
        return;
      }

      router.push(`/orders/${orderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="طلب خدمة جديد" subtitle="أكمل الخطوات لنشر طلبك" />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`h-7 w-7 rounded-full text-xs font-bold grid place-items-center shrink-0 ${
              i < step ? 'bg-primary text-primary-foreground' :
              i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
              'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 0: Service details */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>تفاصيل الخدمة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>نوع الخدمة</Label>
              <Select value={form.cargoType} onValueChange={(v) => { set('cargoType', v); set('requiredServiceType', v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>وصف الطلب <span className="text-destructive">*</span></Label>
              <Textarea
                rows={4}
                value={form.cargoDescription}
                onChange={(e) => set('cargoDescription', e.target.value)}
                placeholder="اشرح بالتفصيل ما تحتاجه — كلما كان الوصف واضحاً، زادت جودة العروض"
              />
              <p className="text-xs text-muted-foreground">{form.cargoDescription.length} حرف (4 على الأقل)</p>
            </div>

            <div className="space-y-2">
              <Label>تعليمات إضافية (اختياري)</Label>
              <Input
                value={form.specialInstructions}
                onChange={(e) => set('specialInstructions', e.target.value)}
                placeholder="مثال: يلزم الحضور الصباحي، التواصل قبل الزيارة"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Location & date */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>الموقع والموعد</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Select value={form.city} onValueChange={(v) => set('city', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تاريخ البدء المطلوب <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.pickupDate}
                onChange={(e) => set('pickupDate', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>مراجعة الطلب</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="نوع الخدمة" value={SERVICE_OPTIONS.find((o) => o.value === form.cargoType)?.label} />
            <Row label="وصف الطلب" value={form.cargoDescription} />
            {form.specialInstructions && <Row label="تعليمات" value={form.specialInstructions} />}
            <hr />
            <Row label="المدينة" value={form.city} />
            <Row label="تاريخ البدء" value={form.pickupDate} />
            <hr />
            <Row label="طريقة الإرسال" value="نشر للجميع (OPEN)" />
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive font-mono break-all">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => { setError(null); setStep((s) => s - 1); }}
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>

        {step < STEPS.length - 1 ? (
          <Button disabled={!canProceed} onClick={() => setStep((s) => s + 1)}>
            التالي
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={submitting} onClick={submit}>
            <Send className="h-4 w-4" />
            {submitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-end">{value ?? '—'}</span>
    </div>
  );
}
