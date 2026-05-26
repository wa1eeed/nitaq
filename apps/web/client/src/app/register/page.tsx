'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, CheckCircle2,
  Eye, EyeOff, Mail, MapPin, Phone, ShieldCheck, Sparkles, Truck, User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DEV_USERS, DEV_BYPASS_TOKEN } from '@naqla/shared-utils';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

type Step = 0 | 1 | 2 | 3 | 4;
type AccountKind = 'INDIVIDUAL' | 'COMPANY';

interface Form {
  // Step 0
  kind: AccountKind | '';
  // Step 1 — basics
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Step 2 — company (only if COMPANY)
  companyNameAr: string;
  companyNameEn: string;
  crNumber: string;
  vatNumber: string;
  city: string;
  region: string;
  address: string;
  // Step 3 — verification
  emailOtp: string;
  phoneOtp: string;
  // Step 4 — preferences
  monthlyVolume: string;
  primaryRoutes: string[];
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptTransport: boolean;
}

const CITIES = ['الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة المكرمة', 'المدينة', 'الطائف', 'تبوك', 'حائل', 'بريدة', 'الجبيل', 'ينبع', 'أبها'];
const REGIONS = ['الوسطى', 'الغربية', 'الشرقية', 'الشمالية', 'الجنوبية'];
const VOLUME_OPTIONS = [
  { value: '< 10,000',     label: 'أقل من 10,000 ر.س' },
  { value: '10,000-50,000',label: '10,000 – 50,000 ر.س' },
  { value: '50,000-200,000',label: '50,000 – 200,000 ر.س' },
  { value: '> 200,000',    label: 'أكثر من 200,000 ر.س' },
];
const ROUTES = ['الرياض - جدة', 'الرياض - الدمام', 'جدة - الدمام', 'الرياض - مكة', 'الرياض - الخبر', 'جدة - مكة'];

export default function ClientRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form>({
    kind: '',
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    companyNameAr: '', companyNameEn: '', crNumber: '', vatNumber: '',
    city: '', region: '', address: '',
    emailOtp: '', phoneOtp: '',
    monthlyVolume: '', primaryRoutes: [], acceptTerms: false, acceptPrivacy: false, acceptTransport: false,
  });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((s) => ({ ...s, [k]: v }));

  const isCompany = form.kind === 'COMPANY';
  const totalSteps = isCompany ? 5 : 4;
  const visibleStep = isCompany ? step : step >= 2 ? (step + 1 as Step) : step;

  const stepValid: Record<number, boolean> = {
    0: !!form.kind,
    1: !!form.fullName.trim() && /\S+@\S+\.\S+/.test(form.email) && /^(\+?966|0)?5\d{8}$/.test(form.phone.replace(/\s+/g, '')) &&
       form.password.length >= 8 && form.password === form.confirmPassword,
    2: !isCompany || (!!form.companyNameAr && /^\d{10}$/.test(form.crNumber) && !!form.city && !!form.region),
    3: form.emailOtp.length === 4 && form.phoneOtp.length === 4,
    4: form.acceptTerms && form.acceptPrivacy && form.acceptTransport,
  };

  const goNext = () => {
    if (!stepValid[step]) return;
    if (step === 1 && !isCompany) setStep(3 as Step);
    else if (step < 4) setStep((step + 1) as Step);
    else submit();
  };
  const goBack = () => {
    if (step === 3 && !isCompany) setStep(1);
    else if (step > 0) setStep((step - 1) as Step);
  };

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem('naqla_client_token', DEV_BYPASS_TOKEN);
    localStorage.setItem('naqla_client_refresh', DEV_BYPASS_TOKEN);
    useAuthStore.setState({ user: { ...DEV_USERS.client, avatar: null } as never });
    router.push('/');
  };

  const toggleRoute = (r: string) => {
    set('primaryRoutes', form.primaryRoutes.includes(r)
      ? form.primaryRoutes.filter((x) => x !== r)
      : [...form.primaryRoutes, r]);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight">نقلة لوجيستك</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
            لديك حساب؟ <span className="text-primary font-semibold">تسجيل الدخول</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Main form */}
        <div className="space-y-6 order-2 lg:order-1">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                الخطوة <span className="num font-medium text-foreground">{visibleStep + 1}</span> من <span className="num">{totalSteps}</span>
              </span>
              <span className="text-xs text-primary font-medium">
                {Math.round(((visibleStep + 1) / totalSteps) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${((visibleStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              {step === 0 && <StepAccountKind form={form} set={set} />}
              {step === 1 && <StepBasics form={form} set={set} showPw={showPw} setShowPw={setShowPw} />}
              {step === 2 && isCompany && <StepCompany form={form} set={set} />}
              {step === 3 && <StepVerify form={form} set={set} />}
              {step === 4 && <StepPreferences form={form} set={set} toggleRoute={toggleRoute} />}

              {/* Nav buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={step === 0 || submitting}
                >
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" /> السابق
                </Button>
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={!stepValid[step] || submitting}
                  size="lg"
                >
                  {step === 4 ? (submitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب') : (
                    <>التالي <ArrowLeft className="h-4 w-4 rtl:rotate-180" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panel — benefits */}
        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-8 space-y-4">
            <Card className="bg-primary text-primary-foreground border-primary">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-bold">لماذا نقلة لوجيستك؟</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <Benefit text="أسعار تنافسية من عشرات الناقلين المعتمدين" />
                  <Benefit text="تأمين شامل على كل شحنة" />
                  <Benefit text="تتبع لحظي على الخريطة" />
                  <Benefit text="دفع آمن عبر Escrow" />
                  <Benefit text="دعم فني على مدار الساعة" />
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold">حماية بياناتك أولوية</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  جميع البيانات مشفّرة، ولا تُشارك مع أطراف ثالثة دون موافقتك. متوافقون مع متطلبات هيئة البيانات.
                </p>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <BadgeCheck className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}

function StepHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Step 0: Account kind ─────────────────────────────────────────────

function StepAccountKind({
  form, set,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  return (
    <>
      <StepHeader icon={User} title="مرحباً بك" subtitle="اختر نوع الحساب الذي يناسبك" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KindCard
          selected={form.kind === 'INDIVIDUAL'}
          onClick={() => set('kind', 'INDIVIDUAL')}
          icon={User}
          title="فرد"
          subtitle="للأشخاص الذين يحتاجون نقل بضائع شخصية أو شحنات متفرّقة"
          tag="مناسب للاستخدام الفردي"
        />
        <KindCard
          selected={form.kind === 'COMPANY'}
          onClick={() => set('kind', 'COMPANY')}
          icon={Building2}
          title="شركة / مؤسسة"
          subtitle="للشركات والمؤسسات التي تحتاج نقل بانتظام"
          tag="مزايا إضافية للشركات"
        />
      </div>
    </>
  );
}

function KindCard({
  selected, onClick, icon: Icon, title, subtitle, tag,
}: { selected: boolean; onClick: () => void; icon: any; title: string; subtitle: string; tag: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start p-5 rounded-xl border-2 text-start transition-all',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40',
      )}
    >
      <div className="flex items-center gap-2 w-full mb-3">
        <div className={cn('h-10 w-10 rounded-lg grid place-items-center', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1" />
        {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{subtitle}</p>
      <Badge variant="outline" className="text-[10px]">{tag}</Badge>
    </button>
  );
}

// ─── Step 1: Basics ───────────────────────────────────────────────────

function StepBasics({
  form, set, showPw, setShowPw,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void; showPw: boolean; setShowPw: (v: boolean) => void }) {
  const pwStrength = strengthScore(form.password);
  return (
    <>
      <StepHeader icon={User} title="معلوماتك الأساسية" subtitle="لإنشاء حسابك والوصول للمنصة" />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">الاسم الكامل</Label>
          <Input id="fullName" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="مثال: محمد بن أحمد العتيبي" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email"><Mail className="h-3.5 w-3.5 inline me-1" /> البريد الإلكتروني</Label>
            <Input id="email" type="email" dir="ltr" className="text-end" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@company.sa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone"><Phone className="h-3.5 w-3.5 inline me-1" /> رقم الجوال</Label>
            <Input id="phone" dir="ltr" className="text-end" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+966 5XX XXX XXXX" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pw">كلمة المرور</Label>
          <div className="relative">
            <Input
              id="pw" type={showPw ? 'text' : 'password'} className="pe-10"
              value={form.password} onChange={(e) => set('password', e.target.value)}
              placeholder="8 أحرف على الأقل"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.password && <PwStrength score={pwStrength} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpw">تأكيد كلمة المرور</Label>
          <Input
            id="cpw" type={showPw ? 'text' : 'password'}
            value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)}
            placeholder="أعد إدخال كلمة المرور"
          />
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين</p>
          )}
        </div>
      </div>
    </>
  );
}

function strengthScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function PwStrength({ score }: { score: number }) {
  const labels = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'ممتازة'];
  const colors = ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-info', 'bg-success'];
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full', i < score ? colors[score] : 'bg-muted')} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">القوة: <span className="font-medium">{labels[score]}</span></p>
    </div>
  );
}

// ─── Step 2: Company (only for COMPANY kind) ─────────────────────────

function StepCompany({
  form, set,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  return (
    <>
      <StepHeader icon={Building2} title="معلومات الشركة" subtitle="بيانات السجل التجاري لشركتك" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>اسم الشركة (عربي)</Label>
            <Input value={form.companyNameAr} onChange={(e) => set('companyNameAr', e.target.value)} placeholder="مثال: شركة الجزيرة للطاقة" />
          </div>
          <div className="space-y-2">
            <Label>اسم الشركة (English)</Label>
            <Input dir="ltr" value={form.companyNameEn} onChange={(e) => set('companyNameEn', e.target.value)} placeholder="e.g. Al Jazirah Energy Co." />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>السجل التجاري (10 أرقام)</Label>
            <Input dir="ltr" className="num text-end" maxLength={10}
              value={form.crNumber} onChange={(e) => set('crNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="1010000000"
            />
          </div>
          <div className="space-y-2">
            <Label>الرقم الضريبي (اختياري)</Label>
            <Input dir="ltr" className="num text-end" maxLength={15}
              value={form.vatNumber} onChange={(e) => set('vatNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="300000000000000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>المدينة</Label>
            <Select value={form.city} onValueChange={(v) => set('city', v)}>
              <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
              <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>المنطقة</Label>
            <Select value={form.region} onValueChange={(v) => set('region', v)}>
              <SelectTrigger><SelectValue placeholder="اختر المنطقة" /></SelectTrigger>
              <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label><MapPin className="h-3.5 w-3.5 inline me-1" /> العنوان</Label>
          <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="الحي، الشارع، المبنى..." />
        </div>
      </div>
    </>
  );
}

// ─── Step 3: Verification (OTP) ──────────────────────────────────────

function StepVerify({
  form, set,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  return (
    <>
      <StepHeader icon={ShieldCheck} title="تحقّق من حسابك" subtitle="أرسلنا رمزاً للبريد والجوال" />
      <div className="space-y-5">
        <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">تم إرسال رمز إلى</div>
            <div className="text-sm font-medium truncate" dir="ltr">{form.email || '—'}</div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>رمز البريد (4 أرقام) — للتجربة: <span className="font-mono text-primary">1234</span></Label>
          <OtpInput value={form.emailOtp} onChange={(v) => set('emailOtp', v)} />
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">تم إرسال رمز إلى</div>
            <div className="text-sm font-medium truncate" dir="ltr">{form.phone || '—'}</div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>رمز الجوال (4 أرقام) — للتجربة: <span className="font-mono text-primary">5678</span></Label>
          <OtpInput value={form.phoneOtp} onChange={(v) => set('phoneOtp', v)} />
        </div>

        <button type="button" className="text-xs text-primary hover:underline">إعادة الإرسال خلال 30 ثانية</button>
      </div>
    </>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            const next = (value.slice(0, i) + v + value.slice(i + 1)).slice(0, 4);
            onChange(next);
            if (v && i < 3) {
              const el = e.target.parentElement?.children[i + 1] as HTMLInputElement;
              el?.focus();
            }
          }}
          className="h-14 w-14 rounded-lg border-2 bg-card text-center text-2xl font-bold num tracking-widest focus:border-primary focus:outline-none"
        />
      ))}
    </div>
  );
}

// ─── Step 4: Preferences & Terms ─────────────────────────────────────

function StepPreferences({
  form, set, toggleRoute,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void; toggleRoute: (r: string) => void }) {
  return (
    <>
      <StepHeader icon={Sparkles} title="آخر خطوة" subtitle="ساعدنا نقدّم لك أفضل تجربة" />
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>حجم الشحنات الشهري المتوقّع (اختياري)</Label>
          <Select value={form.monthlyVolume} onValueChange={(v) => set('monthlyVolume', v)}>
            <SelectTrigger><SelectValue placeholder="اختر النطاق" /></SelectTrigger>
            <SelectContent>
              {VOLUME_OPTIONS.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>المسارات الأكثر استخداماً (اختياري)</Label>
          <p className="text-xs text-muted-foreground">سنُظهر لك أفضل الناقلين على هذه المسارات</p>
          <div className="flex flex-wrap gap-2">
            {ROUTES.map((r) => {
              const on = form.primaryRoutes.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRoute(r)}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-sm transition-colors',
                    on ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40',
                  )}
                >
                  {on && <Check className="h-3 w-3 inline me-1" />}
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 mb-3">
            <p className="text-sm font-semibold">قبل إتمام التسجيل</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              يرجى قراءة والموافقة على المستندات التالية. لا يمكن إتمام التسجيل بدون الموافقة على جميع الشروط.
            </p>
          </div>

          <ConsentRow
            checked={form.acceptTerms}
            onChange={(v) => set('acceptTerms', v)}
            label="أوافق على شروط الاستخدام"
            href={`${process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3000'}/terms`}
          />
          <ConsentRow
            checked={form.acceptPrivacy}
            onChange={(v) => set('acceptPrivacy', v)}
            label="أوافق على سياسة الخصوصية"
            href={`${process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3000'}/privacy`}
          />
          <ConsentRow
            checked={form.acceptTransport}
            onChange={(v) => set('acceptTransport', v)}
            label="أوافق على شروط وأحكام النقل"
            href={`${process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3000'}/transport`}
          />

          <p className="text-xs text-muted-foreground mt-3">
            ستُسجَّل موافقتك مع تاريخها ووقتها والـ IP الخاص بك كسجلّ قانوني.
          </p>
        </div>
      </div>
    </>
  );
}

function ConsentRow({
  checked, onChange, label, href,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; href: string }) {
  return (
    <label className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50">
      <div className="flex items-start gap-3 min-w-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <span className="text-sm leading-relaxed">{label}</span>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-primary hover:underline whitespace-nowrap shrink-0"
      >
        اقرأ الكامل ←
      </a>
    </label>
  );
}
