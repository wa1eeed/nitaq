'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Briefcase, Check, ChevronLeft, ChevronRight, Eye, Loader2,
  MapPin, Plus, Send, Shield, Wifi, X,
} from 'lucide-react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import { api, fetcher } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const SERVICE_OPTIONS = [
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

const CITY_OPTIONS = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر',
  'الأحساء', 'تبوك', 'بريدة', 'أبها', 'خميس مشيط', 'حائل', 'نجران', 'الطائف', 'ينبع',
];

const DELIVERY_MODE_OPTIONS = [
  {
    value: 'ON_SITE' as const,
    icon: Building2,
    title: 'في موقعنا / مقرّنا',
    description: 'المزوّد يحضر إلى موقعك',
  },
  {
    value: 'REMOTE' as const,
    icon: Wifi,
    title: 'عن بُعد / إلكترونياً',
    description: 'الخدمة عبر الإنترنت',
  },
  {
    value: 'AT_PROVIDER' as const,
    icon: Briefcase,
    title: 'في مقر المزوّد',
    description: 'تزور مقر المزوّد',
  },
];

const PICKUP_WINDOW_OPTIONS = [
  { value: 'MORNING' as const, label: 'صباحاً' },
  { value: 'EVENING' as const, label: 'مساءً' },
  { value: 'ALL_DAY' as const, label: 'طوال اليوم' },
];

const STEPS = ['الخدمة', 'الموعد والموقع', 'الإرسال', 'المراجعة'];

type SavedAddress = {
  id: string;
  label: string;
  city: string;
  region?: string;
  address: string;
  kind: string;
  isDefault?: boolean;
};

interface FormState {
  cargoType: string;
  cargoDescription: string;
  specialInstructions: string;
  deliveryMode: 'ON_SITE' | 'REMOTE' | 'AT_PROVIDER';
  city: string;
  pickupDate: string;
  pickupWindow: 'MORNING' | 'EVENING' | 'ALL_DAY';
  orderMode: 'OPEN' | 'DIRECT';
  requiresInsurance: boolean;
}

export default function NewOrderPage() {
  const router = useRouter();
  const companyId = useAuthStore((s) => s.user?.companyId);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    cargoType: 'CONSULTING',
    cargoDescription: '',
    specialInstructions: '',
    deliveryMode: 'ON_SITE',
    city: 'الرياض',
    pickupDate: '',
    pickupWindow: 'ALL_DAY',
    orderMode: 'OPEN',
    requiresInsurance: false,
  });

  // ── Saved addresses (for ON_SITE mode) ──────────────────────────────────────
  const { data: addressesRaw, mutate: refetchAddresses, isLoading: addrLoading } =
    useSWR<unknown>(companyId ? `/companies/${companyId}/addresses` : null, fetcher);

  const savedAddresses: SavedAddress[] = (() => {
    if (!addressesRaw) return [];
    if (Array.isArray(addressesRaw)) return addressesRaw as SavedAddress[];
    const inner = (addressesRaw as { data?: unknown }).data;
    if (Array.isArray(inner)) return inner as SavedAddress[];
    return [];
  })();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showInlineAddForm, setShowInlineAddForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: '', city: 'الرياض', address: '' });
  const [addrSaving, setAddrSaving] = useState(false);

  const saveAddress = async () => {
    if (!companyId || !addrForm.label.trim()) return;
    setAddrSaving(true);
    try {
      const res = await api.post(`/companies/${companyId}/addresses`, {
        label: addrForm.label.trim(),
        city: addrForm.city,
        region: addrForm.city,
        address: addrForm.address.trim() || addrForm.city,
        kind: 'PICKUP',
        contactName: '',
        contactPhone: '',
        isDefault: savedAddresses.length === 0,
      });
      await refetchAddresses();
      const newAddr = ((res.data as { data?: SavedAddress })?.data ?? res.data) as SavedAddress;
      if (newAddr?.id) {
        setSelectedAddressId(newAddr.id);
        set('city', newAddr.city);
      }
      setShowInlineAddForm(false);
      setAddrForm({ label: '', city: 'الرياض', address: '' });
    } catch {
      // ignore — user can retry
    } finally {
      setAddrSaving(false);
    }
  };

  const handleAddressSelect = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    set('city', addr.city);
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const step0Valid = !!form.cargoType && form.cargoDescription.trim().length >= 4;
  const step1Valid =
    !!form.pickupDate &&
    (form.deliveryMode !== 'ON_SITE' || !!selectedAddressId);
  const step2Valid = true;
  const step3Valid = true;

  const canProceed =
    step === 0 ? step0Valid :
    step === 1 ? step1Valid :
    step === 2 ? step2Valid :
    step3Valid;

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const locationCity = selectedAddress?.city ?? form.city ?? 'الرياض';
      const locationAddress = selectedAddress?.address ?? form.city ?? 'الرياض';

      const body = {
        mode: form.orderMode,
        cargoType: form.cargoType,
        cargoDescription: form.cargoDescription.trim(),
        originCity: locationCity,
        originRegion: locationCity,
        originAddress: locationAddress,
        destinationCity: locationCity,
        destinationRegion: locationCity,
        destinationAddress: locationAddress,
        requiredServiceType: form.cargoType,
        requiresInsurance: form.requiresInsurance,
        pickupDate: form.pickupDate,
        pickupWindow: form.pickupWindow,
        ...(form.specialInstructions.trim()
          ? { specialInstructions: form.specialInstructions.trim() }
          : {}),
      };

      const createRes = await api.post('/orders', body);
      const orderId = (createRes.data?.data ?? createRes.data)?.id;
      if (!orderId) throw new Error('لم يُعَد orderId من الـ API');

      await api.post(`/orders/${orderId}/publish`, {});

      router.push(`/orders/${orderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setSubmitting(false);
    }
  };

  const serviceLabel = SERVICE_OPTIONS.find((o) => o.value === form.cargoType)?.label;
  const deliveryModeOption = DELIVERY_MODE_OPTIONS.find((o) => o.value === form.deliveryMode);
  const pickupWindowLabel = PICKUP_WINDOW_OPTIONS.find((o) => o.value === form.pickupWindow)?.label;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="طلب خدمة جديد" subtitle="أكمل الخطوات لنشر طلبك" />

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
            <div
              className={cn(
                'h-7 w-7 rounded-full text-xs font-bold grid place-items-center shrink-0 transition-colors',
                i < step
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs',
                i === step ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: الخدمة ── */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الخدمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>نوع الخدمة <span className="text-destructive">*</span></Label>
              <Select
                value={form.cargoType}
                onValueChange={(v) => set('cargoType', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                وصف الطلب <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={4}
                value={form.cargoDescription}
                onChange={(e) => set('cargoDescription', e.target.value)}
                placeholder="اشرح بالتفصيل ما تحتاجه — كلما كان الوصف واضحاً، زادت جودة العروض"
              />
              <p className="text-xs text-muted-foreground">
                {form.cargoDescription.length} حرف{' '}
                {form.cargoDescription.trim().length < 4 && (
                  <span className="text-destructive">(4 على الأقل)</span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label>تعليمات إضافية <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
              <Input
                value={form.specialInstructions}
                onChange={(e) => set('specialInstructions', e.target.value)}
                placeholder="مثال: يلزم الحضور الصباحي، التواصل قبل الزيارة"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: الموعد والموقع ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>الموعد والموقع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>طريقة تقديم الخدمة</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DELIVERY_MODE_OPTIONS.map(({ value, icon: Icon, title, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      set('deliveryMode', value);
                      setSelectedAddressId(null);
                      setShowInlineAddForm(false);
                    }}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-start transition-colors',
                      form.deliveryMode === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5',
                      form.deliveryMode === value ? 'text-primary' : 'text-muted-foreground',
                    )} />
                    <div>
                      <div className="text-sm font-semibold">{title}</div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── ON_SITE: saved address picker ── */}
            {form.deliveryMode === 'ON_SITE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>موقع الخدمة <span className="text-destructive">*</span></Label>
                  {!showInlineAddForm && (
                    <button
                      type="button"
                      onClick={() => setShowInlineAddForm(true)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة عنوان
                    </button>
                  )}
                </div>

                {addrLoading ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin me-2" />
                    <span className="text-sm">جارٍ تحميل العناوين...</span>
                  </div>
                ) : savedAddresses.length === 0 && !showInlineAddForm ? (
                  <div className="rounded-lg border-2 border-dashed border-border p-5 text-center space-y-3">
                    <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      يجب أولاً حفظ عنوان لمقرك أو أحد فروعك
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInlineAddForm(true)}
                    >
                      <Plus className="h-4 w-4" />
                      إضافة عنوان
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleAddressSelect(addr)}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border-2 p-3 text-start transition-colors',
                          selectedAddressId === addr.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40',
                        )}
                      >
                        <MapPin className={cn(
                          'h-4 w-4 mt-0.5 shrink-0',
                          selectedAddressId === addr.id ? 'text-primary' : 'text-muted-foreground',
                        )} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{addr.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{addr.city}</div>
                          {addr.address && addr.address !== addr.city && (
                            <div className="text-xs text-muted-foreground truncate">{addr.address}</div>
                          )}
                        </div>
                        {selectedAddressId === addr.id && (
                          <Check className="h-4 w-4 text-primary shrink-0 ms-auto mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Inline add address form */}
                {showInlineAddForm && (
                  <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">إضافة عنوان جديد</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineAddForm(false);
                          setAddrForm({ label: '', city: 'الرياض', address: '' });
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">
                        تسمية العنوان <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="مثال: المقر الرئيسي، الفرع الشمالي"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">المدينة</Label>
                      <Select
                        value={addrForm.city}
                        onValueChange={(v) => setAddrForm((p) => ({ ...p, city: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CITY_OPTIONS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">العنوان التفصيلي <span className="text-muted-foreground">(اختياري)</span></Label>
                      <Input
                        placeholder="مثال: شارع الملك فهد، مبنى 12"
                        value={addrForm.address}
                        onChange={(e) => setAddrForm((p) => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!addrForm.label.trim() || addrSaving}
                      onClick={saveAddress}
                    >
                      {addrSaving ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> حفظ...</>
                      ) : (
                        <><Check className="h-3.5 w-3.5" /> حفظ العنوان</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* AT_PROVIDER: city select */}
            {form.deliveryMode === 'AT_PROVIDER' && (
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
            )}

            <div className="space-y-2">
              <Label>تاريخ البدء المطلوب <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.pickupDate}
                onChange={(e) => set('pickupDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>الوقت المفضّل</Label>
              <div className="flex gap-2">
                {PICKUP_WINDOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('pickupWindow', opt.value)}
                    className={cn(
                      'flex-1 rounded-md border-2 py-2 text-sm font-medium transition-colors',
                      form.pickupWindow === opt.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: الإرسال ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>طريقة الإرسال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>اختر كيف تريد نشر طلبك</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* OPEN */}
                <button
                  type="button"
                  onClick={() => set('orderMode', 'OPEN')}
                  className={cn(
                    'relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-start transition-colors',
                    form.orderMode === 'OPEN'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  {form.orderMode === 'OPEN' && (
                    <div className="absolute top-3 end-3 h-5 w-5 rounded-full bg-primary grid place-items-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">نشر للجميع</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      يراه جميع المزوّدين — تحصل على أكثر العروض وأفضلها
                    </div>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                    موصى به
                  </span>
                </button>

                {/* DIRECT */}
                <button
                  type="button"
                  onClick={() => set('orderMode', 'DIRECT')}
                  className={cn(
                    'relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-start transition-colors',
                    form.orderMode === 'DIRECT'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  {form.orderMode === 'DIRECT' && (
                    <div className="absolute top-3 end-3 h-5 w-5 rounded-full bg-primary grid place-items-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="h-10 w-10 rounded-lg bg-muted text-muted-foreground grid place-items-center">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">إرسال لمزود محدد</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      يُرسَل الطلب لمزوّد واحد تختاره مباشرة
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            {/* Insurance toggle */}
            <button
              type="button"
              onClick={() => set('requiresInsurance', !form.requiresInsurance)}
              className={cn(
                'w-full flex items-start gap-4 rounded-xl border-2 p-4 text-start transition-colors',
                form.requiresInsurance
                  ? 'border-success bg-success/5'
                  : 'border-border hover:border-success/40',
              )}
            >
              <div className={cn(
                'h-10 w-10 rounded-lg grid place-items-center shrink-0',
                form.requiresInsurance ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
              )}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">تأمين على الخدمة</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  اطلب من المزوّد توفير تأمين كامل على الخدمة المقدّمة
                </div>
              </div>
              <div className={cn(
                'h-5 w-9 rounded-full transition-colors shrink-0 mt-0.5',
                form.requiresInsurance ? 'bg-success' : 'bg-muted-foreground/30',
              )}>
                <div className={cn(
                  'h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5',
                  form.requiresInsurance ? 'translate-x-4' : 'translate-x-0.5',
                )} />
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: المراجعة ── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>مراجعة الطلب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">الخدمة</p>
              <ReviewRow label="نوع الخدمة" value={serviceLabel} />
              <ReviewRow label="وصف الطلب" value={form.cargoDescription} />
              {form.specialInstructions.trim() && (
                <ReviewRow label="تعليمات إضافية" value={form.specialInstructions} />
              )}
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">الموعد والموقع</p>
              <ReviewRow label="طريقة التقديم" value={deliveryModeOption?.title} />
              {form.deliveryMode === 'ON_SITE' && selectedAddress && (
                <ReviewRow
                  label="موقع الخدمة"
                  value={
                    <span>
                      <span className="font-semibold">{selectedAddress.label}</span>
                      <span className="text-muted-foreground"> — {selectedAddress.city}</span>
                    </span>
                  }
                />
              )}
              {form.deliveryMode === 'AT_PROVIDER' && (
                <ReviewRow label="المدينة" value={form.city} />
              )}
              <ReviewRow label="تاريخ البدء" value={form.pickupDate} />
              <ReviewRow label="الوقت المفضّل" value={pickupWindowLabel} />
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">الإرسال</p>
              <ReviewRow
                label="طريقة النشر"
                value={form.orderMode === 'OPEN' ? 'نشر للجميع' : 'إرسال لمزود محدد'}
              />
              <ReviewRow
                label="التأمين"
                value={form.requiresInsurance ? 'مطلوب' : 'غير مطلوب'}
              />
            </div>
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

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-end">{value ?? '—'}</span>
    </div>
  );
}
