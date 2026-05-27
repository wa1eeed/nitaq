'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Check, ChevronLeft, ChevronRight, Clock, Eye, Package, Radio,
  Search, Send, ShieldCheck, Truck, UserSearch, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { playSoundIfEnabled } from '@/lib/sound';
import { DEFAULT_CITIES } from '@naqla/shared-utils';
import { api, fetcher } from '@/lib/api';

export type PickupWindow = 'MORNING' | 'EVENING' | 'ALL_DAY';

interface FormState {
  cargoType: string;
  cargoDescription: string;
  originAddress: string;
  originCity: string;
  destinationCity: string;
  pickupDate: string;
  pickupWindow: PickupWindow;
  mode: 'OPEN' | 'DIRECT' | null;
  targetCarrierId: string | null;
  hasPreAgreedPrice: boolean;
  agreedPriceUpfront: number | null;
  truckType: string;
  requiresInsurance: boolean;
  specialInstructions: string;
}

const STEPS = [
  { id: 1, label: 'الخدمة',           icon: Package },
  { id: 2, label: 'التوقيت',          icon: Clock },
  { id: 3, label: 'طريقة الإرسال',   icon: Send },
  { id: 4, label: 'المتطلبات',        icon: Wallet },
  { id: 5, label: 'مراجعة',           icon: Eye },
];

const SERVICE_CATEGORIES = [
  { value: 'CONSULTING',         label: 'استشارات' },
  { value: 'DESIGN',             label: 'تصميم' },
  { value: 'INSTALLATION',       label: 'تركيب وتنصيب' },
  { value: 'MAINTENANCE',        label: 'صيانة' },
  { value: 'TECHNICAL_SUPPORT',  label: 'دعم تقني' },
  { value: 'TRAINING',           label: 'تدريب' },
  { value: 'IT_SERVICES',        label: 'خدمات تقنية' },
  { value: 'LOGISTICS',          label: 'لوجستيات' },
  { value: 'PROJECT_MANAGEMENT', label: 'إدارة مشاريع' },
  { value: 'OTHER',              label: 'أخرى' },
];

const SERVICE_TYPES = [
  { value: 'CONSULTING',         label: 'استشارات' },
  { value: 'DESIGN',             label: 'تصميم' },
  { value: 'INSTALLATION',       label: 'تركيب وتنصيب' },
  { value: 'MAINTENANCE',        label: 'صيانة' },
  { value: 'TECHNICAL_SUPPORT',  label: 'دعم تقني' },
  { value: 'TRAINING',           label: 'تدريب' },
  { value: 'IT_SERVICES',        label: 'خدمات تقنية' },
  { value: 'LOGISTICS',          label: 'لوجستيات' },
  { value: 'PROJECT_MANAGEMENT', label: 'إدارة مشاريع' },
  { value: 'OTHER',              label: 'أخرى' },
];

type CatalogCity = { id: string; nameAr: string; nameEn: string; region: string; lat: number; lng: number; active?: boolean };
type CatalogTruckType = { id: string; nameAr: string; active?: boolean };
type CatalogData = { cities: CatalogCity[] | null; cargoTypes: unknown; truckTypes: CatalogTruckType[] | null };
type ApiCarrier = { id: string; nameAr: string; nameEn: string | null; city: string; status: string; kycStatus: string };

export default function NewOrderWizard() {
  const router = useRouter();
  const { data: catalog } = useSWR<CatalogData>('/settings/catalogs', fetcher);
  const { data: carriersRaw, isLoading: carriersLoading } =
    useSWR<ApiCarrier[]>('/companies?type=CARRIER&status=ACTIVE&limit=100', fetcher);
  const [step, setStep] = useState(1);
  const [carrierSearch, setCarrierSearch] = useState('');
  const [form, setForm] = useState<FormState>({
    cargoType: 'CONSULTING',
    cargoDescription: '',
    originAddress: '',
    originCity: 'الرياض',
    destinationCity: 'الرياض',
    pickupDate: '',
    pickupWindow: 'ALL_DAY',
    mode: null,
    targetCarrierId: null,
    hasPreAgreedPrice: false,
    agreedPriceUpfront: null,
    truckType: 'CONSULTING',
    requiresInsurance: false,
    specialInstructions: '',
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const carriers: ApiCarrier[] = useMemo(
    () => (carriersRaw ?? []).filter(
      (c) => !carrierSearch || c.nameAr.includes(carrierSearch) || c.city.includes(carrierSearch),
    ),
    [carriersRaw, carrierSearch],
  );

  const activeCities: CatalogCity[] = catalog?.cities
    ? catalog.cities.filter((c) => c.active !== false)
    : DEFAULT_CITIES.filter((c) => c.active);
  const serviceTypesList: { value: string; label: string }[] = catalog?.truckTypes
    ? catalog.truckTypes.filter((t) => t.active !== false).map((t) => ({ value: t.id, label: t.nameAr }))
    : SERVICE_TYPES;

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return !!form.cargoType && form.cargoDescription.length > 3;
      case 2: return !!form.pickupDate;
      case 3: return form.mode === 'OPEN' || (
        form.mode === 'DIRECT' && !!form.targetCarrierId &&
        (!form.hasPreAgreedPrice || (form.agreedPriceUpfront != null && form.agreedPriceUpfront > 0))
      );
      case 4: return !!form.truckType;
      default: return true;
    }
  }, [step, form]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const body = {
        mode: form.mode ?? 'OPEN',
        cargoType: form.cargoType,
        cargoDescription: form.cargoDescription,
        originCity: form.originCity,
        originRegion: form.originCity,
        originAddress: form.originAddress || form.originCity,
        destinationCity: form.originCity,
        destinationRegion: form.originCity,
        destinationAddress: form.originAddress || form.originCity,
        requiredServiceType: form.truckType,
        requiresInsurance: form.requiresInsurance,
        pickupDate: form.pickupDate,
        pickupWindow: form.pickupWindow,
        ...(form.specialInstructions ? { specialInstructions: form.specialInstructions } : {}),
        ...(form.mode === 'DIRECT' && form.targetCarrierId
          ? { targetProviderId: form.targetCarrierId }
          : {}),
        ...(form.mode === 'DIRECT' && form.hasPreAgreedPrice && form.agreedPriceUpfront
          ? { agreedPriceUpfront: form.agreedPriceUpfront }
          : {}),
      };
      const res = await api.post('/orders', body);
      const created = res.data?.data ?? res.data;
      const orderId = created?.id;
      if (!orderId) {
        throw new Error('الـ API رجّع استجابة بدون orderId — تأكّد من حالة الـ Backend');
      }
      try {
        await api.post(`/orders/${orderId}/publish`, {});
      } catch (publishErr: unknown) {
        const msg = publishErr instanceof Error ? publishErr.message : String(publishErr);
        setSubmitError(`الطلب أُنشئ (${created.orderNumber ?? orderId}) لكن فشل نشره: ${msg}`);
        setSubmitting(false);
        router.push(`/orders/${orderId}`);
        return;
      }
      playSoundIfEnabled('orderSent');
      router.push(`/orders/${orderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(`فشل إنشاء الطلب: ${msg}`);
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="طلب خدمة جديد" subtitle="املأ الخطوات التالية لنشر طلبك" />

      {/* Stepper */}
      <Card>
        <CardContent className="py-5 overflow-x-auto">
          <ol className="flex items-center min-w-max">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isDone = s.id < step;
              const isActive = s.id === step;
              const clickable = isDone;
              return (
                <li key={s.id} className="flex items-center min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => clickable && setStep(s.id)}
                      className={cn(
                        'shrink-0 h-9 w-9 rounded-full grid place-items-center border transition-colors',
                        isDone && 'bg-primary border-primary text-primary-foreground',
                        isActive && 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/15',
                        !isDone && !isActive && 'bg-card border-border text-muted-foreground',
                        clickable ? 'cursor-pointer' : 'cursor-default',
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                    </button>
                    <span className={cn('text-sm font-medium whitespace-nowrap', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-3 h-px bg-border min-w-[20px]" />
                  )}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <Step title="تفاصيل الخدمة" description="ما الخدمة التي تحتاجها؟">
              <div className="space-y-2">
                <Label>نوع الخدمة</Label>
                <Select value={form.cargoType} onValueChange={(v) => set('cargoType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>وصف الطلب</Label>
                <Textarea
                  value={form.cargoDescription}
                  onChange={(e) => set('cargoDescription', e.target.value)}
                  placeholder="مثال: نحتاج تركيب منظومة كاميرات مراقبة في مستودع بالرياض"
                />
                <p className="text-xs text-muted-foreground">وصف مختصر يساعد مزود الخدمة على فهم المتطلبات</p>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="التوقيت والموقع" description="حدّد موعد تنفيذ الخدمة وموقعها">
              <div className="space-y-2">
                <Label>موقع تنفيذ الخدمة (اختياري)</Label>
                <Input
                  value={form.originAddress}
                  onChange={(e) => set('originAddress', e.target.value)}
                  placeholder="مثال: حي الملقا، الرياض — المستودع الرئيسي"
                />
                <p className="text-xs text-muted-foreground">يمكن تركه فارغاً وتحديده لاحقاً مع مزود الخدمة</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ البدء المطلوب</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={form.pickupDate}
                    onChange={(e) => set('pickupDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نافذة التوقيت</Label>
                  <Select value={form.pickupWindow} onValueChange={(v) => set('pickupWindow', v as PickupWindow)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORNING">🌅 صباحاً (8:00 - 12:00)</SelectItem>
                      <SelectItem value="EVENING">🌇 مساءً (12:00 - 18:00)</SelectItem>
                      <SelectItem value="ALL_DAY">☀️ طوال اليوم (8:00 - 18:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 مزود الخدمة سيؤكّد الوقت الدقيق داخل النافذة عند قبول العرض.
              </p>
            </Step>
          )}

          {step === 3 && (
            <Step title="كيف تريد إرسال الطلب؟" description="انشره لكل مزودي الخدمة أو أرسله مباشرة لمزود محدد">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChoiceCard
                  selected={form.mode === 'OPEN'}
                  onClick={() => { set('mode', 'OPEN'); set('targetCarrierId', null); }}
                  icon={<Radio className="h-6 w-6" />}
                  title="نشر للجميع"
                  description="يظهر طلبك لكل مزودي الخدمة المؤهلين وتستقبل عروضاً متعددة للمقارنة."
                  badge="موصى به"
                />
                <ChoiceCard
                  selected={form.mode === 'DIRECT'}
                  onClick={() => set('mode', 'DIRECT')}
                  icon={<UserSearch className="h-6 w-6" />}
                  title="إرسال مباشر"
                  description="اختر مزوّداً معتمداً وأرسل له الطلب بشكل مباشر."
                />
              </div>

              {form.mode === 'DIRECT' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>اختر مزوّداً معتمداً</Label>
                    <span className="text-xs text-muted-foreground">
                      {carriersLoading ? 'جارٍ التحميل...' : `${carriers.length} مزوّد متاح`}
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث باسم الشركة أو المدينة..."
                      value={carrierSearch}
                      onChange={(e) => setCarrierSearch(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {carriersLoading && (
                      <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
                        <Truck className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                        جارٍ تحميل المزوّدين...
                      </div>
                    )}
                    {!carriersLoading && carriers.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
                        لا يوجد مزوّدون مطابقون للبحث
                      </div>
                    )}
                    {carriers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => set('targetCarrierId', c.id)}
                        className={cn(
                          'text-start p-4 rounded-lg border-2 transition-all flex items-start gap-3',
                          form.targetCarrierId === c.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40',
                        )}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{c.nameAr.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{c.nameAr}</div>
                          {c.nameEn && <div className="text-xs text-muted-foreground truncate" dir="ltr">{c.nameEn}</div>}
                          <div className="text-xs text-muted-foreground mt-1">{c.city}</div>
                        </div>
                        {form.targetCarrierId === c.id && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {form.targetCarrierId && (
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">هل لديك سعر متفق مسبقاً مع هذا المزوّد؟</div>
                          <div className="text-xs text-muted-foreground mt-0.5">يتجاوز مرحلة التفاوض ويُسند الطلب مباشرة</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => { set('hasPreAgreedPrice', true); }}
                            className={cn(
                              'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
                              form.hasPreAgreedPrice
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border text-muted-foreground hover:bg-muted',
                            )}
                          >
                            نعم
                          </button>
                          <button
                            type="button"
                            onClick={() => { set('hasPreAgreedPrice', false); set('agreedPriceUpfront', null); }}
                            className={cn(
                              'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
                              !form.hasPreAgreedPrice
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border text-muted-foreground hover:bg-muted',
                            )}
                          >
                            لا — تفاوض عادي
                          </button>
                        </div>
                      </div>
                      {form.hasPreAgreedPrice && (
                        <div className="space-y-1.5">
                          <Label htmlFor="agreed-price">السعر المتفق عليه (ريال)</Label>
                          <Input
                            id="agreed-price"
                            type="number"
                            dir="ltr"
                            min={1}
                            placeholder="0.00"
                            className="text-end"
                            value={form.agreedPriceUpfront ?? ''}
                            onChange={(e) => set('agreedPriceUpfront', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Step>
          )}

          {step === 4 && (
            <Step title="المتطلبات" description="حدّد نوع الخدمة المطلوبة والخصائص الإضافية">
              <div className="space-y-2">
                <Label>نوع الخدمة المطلوبة</Label>
                <Select value={form.truckType} onValueChange={(v) => set('truckType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {serviceTypesList.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  مزودو الخدمة سيقدّمون عروضهم بالأسعار التنافسية — لا حاجة لتحديد ميزانية مسبقة.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ToggleCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="تأمين شامل"
                  description="ضمان تنفيذ الخدمة وتعويض عند الإخلال"
                  checked={form.requiresInsurance}
                  onChange={(v) => set('requiresInsurance', v)}
                />
              </div>

              <div className="space-y-2">
                <Label>تعليمات خاصة (اختياري)</Label>
                <Textarea value={form.specialInstructions} onChange={(e) => set('specialInstructions', e.target.value)}
                  placeholder="مثال: يلزم حضور مهندس موقع، الدخول من الباب الرئيسي فقط" />
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step title="مراجعة وإرسال" description="تأكد من المعلومات قبل النشر">
              <Section title="الخدمة">
                <Row label="نوع الخدمة" value={SERVICE_CATEGORIES.find((c) => c.value === form.cargoType)?.label} />
                <Row label="وصف الطلب" value={form.cargoDescription} />
              </Section>
              <Separator />
              <Section title="التوقيت">
                <Row label="الموقع" value={form.originAddress || '—'} />
                <Row label="تاريخ البدء" value={form.pickupDate || '—'} />
              </Section>
              <Separator />
              <Section title="طريقة الإرسال">
                <Row label="النوع" value={form.mode === 'OPEN' ? 'نشر للجميع' : 'إرسال مباشر'} />
                {form.mode === 'DIRECT' && form.targetCarrierId && (
                  <Row label="المزوّد" value={carriersRaw?.find((c) => c.id === form.targetCarrierId)?.nameAr ?? '—'} />
                )}
              </Section>
              <Separator />
              <Section title="المتطلبات">
                <Row label="نوع الخدمة المطلوبة" value={serviceTypesList.find((t) => t.value === form.truckType)?.label} />
                <Row label="تأمين" value={form.requiresInsurance ? 'نعم' : 'لا'} />
                {form.specialInstructions && <Row label="تعليمات" value={form.specialInstructions} />}
              </Section>
            </Step>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          السابق
        </Button>
        {step < STEPS.length ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            التالي
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={!canNext || submitting}>
            <Send className="h-4 w-4" />
            {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </Button>
        )}
      </div>
      {submitError && (
        <div className="mt-3 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}
    </>
  );
}

function Step({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ChoiceCard({
  icon, title, description, selected, badge, onClick,
}: { icon: React.ReactNode; title: string; description: string; selected: boolean; badge?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-start p-5 rounded-xl border-2 transition-all flex items-start gap-4',
        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
      )}
    >
      <div className={cn(
        'shrink-0 h-12 w-12 rounded-xl grid place-items-center',
        selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold">{title}</h3>
          {badge && <Badge variant="warning" className="text-[10px]">{badge}</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <span className={cn(
        'h-6 w-6 rounded-full border-2 grid place-items-center shrink-0',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
      )}>
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

function ToggleCard({
  icon, title, description, checked, onChange,
}: { icon: React.ReactNode; title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'text-start p-4 rounded-lg border-2 transition-all flex items-start gap-3',
        checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
      )}
    >
      <div className={cn(
        'shrink-0 h-10 w-10 rounded-md grid place-items-center',
        checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-end max-w-[60%]">{value ?? '—'}</dd>
    </div>
  );
}
