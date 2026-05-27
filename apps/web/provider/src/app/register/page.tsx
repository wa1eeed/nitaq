'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Briefcase, Building2, Check, CheckCircle2,
  Eye, EyeOff, FileCheck2, Mail, MapPin, Phone, ShieldCheck,
  Sparkles, Upload, User, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DEV_USERS, DEV_BYPASS_TOKEN } from '@naqla/shared-utils';
import { useTruckTypesStore } from '@/stores/truck-types-store';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type AccountType = 'COMPANY' | 'INDIVIDUAL';
type VatChoice = 'REGISTERED' | 'NOT_REGISTERED' | '';

interface Form {
  // Step 0 — account type (NEW)
  accountType: AccountType | '';

  // Step 1 — personal/account basics
  fullName: string;
  position: string;        // for COMPANY only — owner/GM/ops/fleet/authorized
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;

  // Step 2 — business/personal info
  companyNameAr: string;        // for COMPANY
  companyNameEn: string;        // for COMPANY
  crNumber: string;             // for COMPANY only (10 digits)
  nationalId: string;           // for INDIVIDUAL only (10 digits)
  vatChoice: VatChoice;         // for both — REGISTERED | NOT_REGISTERED
  vatNumber: string;            // required only if vatChoice === REGISTERED
  city: string;
  region: string;
  address: string;
  yearsInBusiness: string;
  // Step 2 — fleet
  fleetSize: string;
  truckTypes: string[];
  hasGps: boolean;
  hasInsurance: boolean;
  hasRefrigeration: boolean;
  primaryRegions: string[];
  // Step 3 — compliance docs
  docs: Record<string, File | null>;
  // Step 4 — bank
  iban: string;
  bankName: string;
  accountHolder: string;
  // Step 5 — verification + terms
  emailOtp: string;
  phoneOtp: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptTransport: boolean;
  acceptCommission: boolean;
}

const CITIES = ['الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة المكرمة', 'المدينة', 'الطائف', 'تبوك', 'حائل', 'بريدة', 'الجبيل', 'ينبع', 'أبها'];
const REGIONS = ['الوسطى', 'الغربية', 'الشرقية', 'الشمالية', 'الجنوبية'];
const FLEET_SIZES = [
  { v: '1-5',   l: '1 – 5 موارد' },
  { v: '6-15',  l: '6 – 15 مورد' },
  { v: '16-50', l: '16 – 50 مورد' },
  { v: '50+',   l: 'أكثر من 50' },
];
const YEARS_OPTS = [
  { v: '<1',  l: 'أقل من سنة' },
  { v: '1-3', l: '1 – 3 سنوات' },
  { v: '3-10',l: '3 – 10 سنوات' },
  { v: '10+', l: 'أكثر من 10' },
];
/**
 * Documents required vary by account type.
 *
 * COMPANY (Saudi MoCI + Ministry of Transport):
 *   - السجل التجاري (CR)
 *   - شهادة الضريبة (VAT) — if registered
 *   - شهادة الزكاة والدخل
 *   - رخصة نقل البضائع (التي تصدرها هيئة النقل العام / TGA)
 *   - بوليصة التأمين
 *
 * INDIVIDUAL (per Saudi TGA regulations for individual freight carriers):
 *   - الهوية الوطنية
 *   - رخصة قيادة سارية بفئة مناسبة لنوع الشاحنة (متوسطة/ثقيلة/تركيب وقاطرة)
 *   - استمارة الشاحنة (الاستمارة) — الملكية
 *   - رخصة النقل بالأجرة للأفراد (إن انطبقت)
 *   - تأمين الشاحنة (شامل أو ضد الغير)
 *   - شهادة الضريبة (VAT) — اختيارية للأفراد إذا تجاوزت إيراداتهم 375,000 ر.س.
 */
const COMPANY_DOCS = [
  { id: 'CR',        label: 'السجل التجاري',          required: true },
  { id: 'ZAKAT',     label: 'شهادة الزكاة والدخل',    required: true },
  { id: 'TRANSPORT', label: 'ترخيص مزاولة النشاط', required: true },
  { id: 'INSURANCE', label: 'بوليصة التأمين',          required: true },
  { id: 'VAT',       label: 'شهادة الضريبة (VAT)',     required: false, vatOnly: true },
  { id: 'BANK',      label: 'خطاب IBAN من البنك',     required: false },
];

const INDIVIDUAL_DOCS = [
  { id: 'NATIONAL_ID',     label: 'صورة الهوية الوطنية',                       required: true },
  { id: 'DRIVING_LICENSE', label: 'رخصة القيادة (فئة مناسبة)',                  required: true },
  { id: 'PROFESSIONAL_CERT', label: 'شهادة الكفاءة المهنية',                    required: true },
  { id: 'INSURANCE',         label: 'تأمين ضد المسؤولية المهنية',               required: true },
  { id: 'ACTIVITY_PERMIT',   label: 'تصريح مزاولة النشاط',                      required: false },
  { id: 'VAT',             label: 'شهادة الضريبة (VAT)',                         required: false, vatOnly: true },
  { id: 'BANK',            label: 'خطاب IBAN من البنك',                          required: false },
];

interface DocSpec { id: string; label: string; required: boolean; vatOnly?: boolean }

function docsFor(accountType: AccountType | '', vatChoice: VatChoice): DocSpec[] {
  const list: DocSpec[] = accountType === 'INDIVIDUAL' ? INDIVIDUAL_DOCS : COMPANY_DOCS;
  // Hide VAT-specific doc rows if user said "Not registered"
  return list.filter((d) => !(d.vatOnly && vatChoice !== 'REGISTERED'));
}
const BANKS = ['الراجحي', 'الأهلي SNB', 'الرياض', 'البلاد', 'الإنماء', 'ساب', 'العربي الوطني', 'الفرنسي', 'الاستثمار'];

const STEPS_META = [
  { title: 'نوع الحساب',        icon: User },
  { title: 'الحساب',             icon: User },
  { title: 'المعلومات',          icon: Building2 },
  { title: 'الخدمات',              icon: Briefcase },
  { title: 'المستندات',           icon: FileCheck2 },
  { title: 'الحساب البنكي',      icon: Building2 },
  { title: 'التحقّق',             icon: ShieldCheck },
];

export default function CarrierRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form>({
    accountType: '',
    fullName: '', position: '', email: '', phone: '', password: '', confirmPassword: '',
    companyNameAr: '', companyNameEn: '', crNumber: '', nationalId: '',
    vatChoice: '', vatNumber: '',
    city: '', region: '', address: '', yearsInBusiness: '',
    fleetSize: '', truckTypes: [], hasGps: true, hasInsurance: true, hasRefrigeration: false,
    primaryRegions: [],
    docs: {},
    iban: '', bankName: '', accountHolder: '',
    emailOtp: '', phoneOtp: '',
    acceptTerms: false, acceptPrivacy: false, acceptTransport: false, acceptCommission: false,
  });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((s) => ({ ...s, [k]: v }));

  const isIndividual = form.accountType === 'INDIVIDUAL';
  const docsList = useMemo(() => docsFor(form.accountType, form.vatChoice), [form.accountType, form.vatChoice]);

  const stepValid: Record<number, boolean> = {
    // Step 0: choose account type
    0: form.accountType === 'COMPANY' || form.accountType === 'INDIVIDUAL',

    // Step 1: account basics (position only required for companies)
    1: !!form.fullName.trim() &&
       (isIndividual || !!form.position) &&
       /\S+@\S+\.\S+/.test(form.email) &&
       /^(\+?966|0)?5\d{8}$/.test(form.phone.replace(/\s+/g, '')) &&
       form.password.length >= 8 && form.password === form.confirmPassword,

    // Step 2: business info — different requirements per account type
    2: !!form.city && !!form.region && !!form.yearsInBusiness && !!form.vatChoice &&
       (form.vatChoice !== 'REGISTERED' || /^\d{15}$/.test(form.vatNumber)) &&
       (isIndividual
          ? /^\d{10}$/.test(form.nationalId)
          : !!form.companyNameAr && /^\d{10}$/.test(form.crNumber)
       ),

    // Step 3: fleet
    3: !!form.fleetSize && form.truckTypes.length > 0 && form.primaryRegions.length > 0,

    // Step 4: docs — only required ones
    4: docsList.filter((d) => d.required).every((d) => !!form.docs[d.id]),

    // Step 5: bank
    5: /^SA\d{22}$/.test(form.iban.replace(/\s+/g, '')) && !!form.bankName && !!form.accountHolder,

    // Step 6: verification + consent
    6: form.emailOtp.length === 4 && form.phoneOtp.length === 4 &&
       form.acceptTerms && form.acceptPrivacy && form.acceptTransport && form.acceptCommission,
  };

  const goNext = () => {
    if (!stepValid[step]) return;
    if (step < 6) setStep((step + 1) as Step);
    else submit();
  };
  const goBack = () => { if (step > 0) setStep((step - 1) as Step); };

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem('nitaq_carrier_token', DEV_BYPASS_TOKEN);
    localStorage.setItem('nitaq_carrier_refresh', DEV_BYPASS_TOKEN);
    useAuthStore.setState({ user: { ...DEV_USERS.carrier, avatar: null } as never });
    router.push('/');
  };

  const toggleTruck = (id: string) => set('truckTypes', form.truckTypes.includes(id) ? form.truckTypes.filter((x) => x !== id) : [...form.truckTypes, id]);
  const toggleRegion = (r: string) => set('primaryRegions', form.primaryRegions.includes(r) ? form.primaryRegions.filter((x) => x !== r) : [...form.primaryRegions, r]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight">نِطاق · المزوّد</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
            لديك حساب؟ <span className="text-primary font-semibold">تسجيل الدخول</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6 order-2 lg:order-1">
          {/* Stepper */}
          <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-thin pb-2">
            {STEPS_META.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <li key={s.title} className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <div
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap',
                      isActive ? 'bg-primary text-primary-foreground font-semibold' :
                      isDone ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    <div className={cn(
                      'h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold',
                      isActive ? 'bg-primary-foreground text-primary' :
                      isDone ? 'bg-success/15' : 'bg-muted',
                    )}>
                      {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </div>
                    <span className="hidden sm:inline">{s.title}</span>
                  </div>
                  {i < STEPS_META.length - 1 && <div className="h-px w-3 sm:w-5 bg-border" />}
                </li>
              );
            })}
          </ol>

          <Card>
            <CardContent className="pt-6 space-y-6">
              {step === 0 && <StepAccountType form={form} set={set} />}
              {step === 1 && <StepBasics form={form} set={set} showPw={showPw} setShowPw={setShowPw} isIndividual={isIndividual} />}
              {step === 2 && <StepCompany form={form} set={set} isIndividual={isIndividual} />}
              {step === 3 && <StepFleet form={form} set={set} toggleTruck={toggleTruck} toggleRegion={toggleRegion} />}
              {step === 4 && <StepDocs form={form} set={set} docsList={docsList} />}
              {step === 5 && <StepBank form={form} set={set} />}
              {step === 6 && <StepVerify form={form} set={set} />}

              <div className="flex items-center justify-between gap-3 pt-4 border-t">
                <Button variant="outline" onClick={goBack} disabled={step === 0 || submitting}>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" /> السابق
                </Button>
                <Button onClick={goNext} disabled={!stepValid[step] || submitting} size="lg">
                  {step === 6
                    ? (submitting ? 'جارٍ التقديم...' : 'تقديم طلب التسجيل')
                    : (<>التالي <ArrowLeft className="h-4 w-4 rtl:rotate-180" /></>)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-8 space-y-4">
            <Card className="bg-primary text-primary-foreground border-primary">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-bold">انضم كمزوّد على نِطاق</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <Benefit text="آلاف الطلبات شهرياً عبر المنصة" />
                  <Benefit text="دفع مضمون عبر Escrow بعد الإنجاز" />
                  <Benefit text="إدارة كاملة لخدماتك وموظفيك" />
                  <Benefit text="تقارير وإحصاءات أداء مفصّلة" />
                  <Benefit text="عمولة 8% فقط — بدون رسوم خفية" />
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <FileCheck2 className="h-4 w-4" />
                  <span className="text-xs font-semibold">طلبك يخضع للمراجعة</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  بعد تقديم الطلب، يراجع فريق الامتثال المستندات خلال 24 – 48 ساعة عمل، ثم يتم تفعيل حسابك.
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

// ─── Step 0: Account Type — Company vs Individual ────────────────────

function StepAccountType({
  form, set,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  return (
    <>
      <StepHeader icon={User} title="نوع حسابك" subtitle="اختر النوع الذي يناسب وضعك القانوني" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <KindCard
          selected={form.accountType === 'COMPANY'}
          onClick={() => set('accountType', 'COMPANY')}
          icon={Building2}
          title="شركة خدمات"
          subtitle="مؤسسة أو شركة مرخّصة لها سجل تجاري ساري"
          bullets={['سجل تجاري إلزامي', 'ترخيص مزاولة النشاط', 'مناسب للشركات المتوسطة والكبيرة', 'إمكانية تسجيل ضريبي']}
          tag="للشركات"
        />
        <KindCard
          selected={form.accountType === 'INDIVIDUAL'}
          onClick={() => set('accountType', 'INDIVIDUAL')}
          icon={User}
          title="مزوّد فرد"
          subtitle="فرد يقدّم خدماته بشكل مستقل على هويته الشخصية"
          bullets={['الهوية الوطنية تكفي (لا سجل تجاري)', 'شهادة كفاءة مهنية', 'تأمين مهني', 'الضريبة اختيارية']}
          tag="للأفراد المستقلين"
        />
      </div>

      <div className="rounded-lg bg-info/10 border border-info/30 p-3 flex items-start gap-2 text-sm">
        <ShieldCheck className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          متطلبات التسجيل تختلف حسب النوع. الأفراد لا يحتاجون سجلاً تجارياً، لكن يجب توفير الهوية الوطنية،
          شهادة الكفاءة المهنية، والتأمين المهني — وفق أنظمة مزاولة النشاط.
        </p>
      </div>
    </>
  );
}

function KindCard({
  selected, onClick, icon: Icon, title, subtitle, bullets, tag,
}: {
  selected: boolean; onClick: () => void; icon: any;
  title: string; subtitle: string; bullets: string[]; tag: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start p-5 rounded-xl border-2 text-start transition-all',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40',
      )}
    >
      <div className="flex items-center justify-between gap-2 w-full mb-3">
        <div className={cn('h-11 w-11 rounded-xl grid place-items-center', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          <Icon className="h-5 w-5" />
        </div>
        {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
      </div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{subtitle}</p>
      <ul className="space-y-1.5 text-xs mb-3">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <Check className="h-3 w-3 shrink-0 mt-0.5 text-success" />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
      <Badge variant="outline" className="text-[10px]">{tag}</Badge>
    </button>
  );
}

// ─── Step 1: Basics ───────────────────────────────────────────────────

function StepBasics({
  form, set, showPw, setShowPw, isIndividual,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void; showPw: boolean; setShowPw: (v: boolean) => void; isIndividual: boolean }) {
  return (
    <>
      <StepHeader
        icon={User}
        title={isIndividual ? 'بياناتك الشخصية' : 'بيانات المسؤول'}
        subtitle={isIndividual ? 'معلوماتك كمزوّد فرد' : 'معلومات الشخص المخوّل في الشركة'}
      />
      <div className="space-y-4">
        <div className={cn('grid grid-cols-1 gap-4', !isIndividual && 'sm:grid-cols-2')}>
          <div className="space-y-2">
            <Label>الاسم الكامل</Label>
            <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="الاسم الرباعي" />
          </div>
          {!isIndividual && (
            <div className="space-y-2">
              <Label>المسمّى الوظيفي</Label>
              <Select value={form.position} onValueChange={(v) => set('position', v)}>
                <SelectTrigger><SelectValue placeholder="اختر المسمّى" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">المالك</SelectItem>
                  <SelectItem value="GM">المدير العام</SelectItem>
                  <SelectItem value="OPS_MANAGER">مدير العمليات</SelectItem>
                  <SelectItem value="FLEET_MANAGER">مدير الخدمات</SelectItem>
                  <SelectItem value="AUTHORIZED">مفوّض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label><Mail className="h-3.5 w-3.5 inline me-1" /> البريد الإلكتروني</Label>
            <Input type="email" dir="ltr" className="text-end" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="ops@company.sa" />
          </div>
          <div className="space-y-2">
            <Label><Phone className="h-3.5 w-3.5 inline me-1" /> رقم الجوال</Label>
            <Input dir="ltr" className="text-end" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+966 5XX XXX XXXX" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>كلمة المرور</Label>
          <div className="relative">
            <Input type={showPw ? 'text' : 'password'} className="pe-10"
              value={form.password} onChange={(e) => set('password', e.target.value)}
              placeholder="8 أحرف على الأقل"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>تأكيد كلمة المرور</Label>
          <Input type={showPw ? 'text' : 'password'}
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

// ─── Step 2: Company / Individual info ───────────────────────────────

function StepCompany({
  form, set, isIndividual,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void; isIndividual: boolean }) {
  return (
    <>
      <StepHeader
        icon={Building2}
        title={isIndividual ? 'معلوماتك كمزوّد فرد' : 'بيانات الشركة'}
        subtitle={isIndividual ? 'الهوية والعنوان وحالة الضريبة' : 'السجل التجاري وعنوان النشاط'}
      />
      <div className="space-y-4">
        {isIndividual ? (
          // ── INDIVIDUAL: National ID instead of CR ─────────────────
          <div className="space-y-2">
            <Label>رقم الهوية الوطنية</Label>
            <Input
              dir="ltr" className="num text-end" maxLength={10}
              value={form.nationalId}
              onChange={(e) => set('nationalId', e.target.value.replace(/\D/g, ''))}
              placeholder="1xxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">10 أرقام — يجب أن تطابق الهوية المرفقة لاحقاً في المستندات</p>
          </div>
        ) : (
          // ── COMPANY: Company name + CR ────────────────────────────
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الشركة (عربي)</Label>
                <Input value={form.companyNameAr} onChange={(e) => set('companyNameAr', e.target.value)} placeholder="مثال: الجزيرة للخدمات المتكاملة" />
              </div>
              <div className="space-y-2">
                <Label>اسم الشركة (English) <span className="text-muted-foreground">— اختياري</span></Label>
                <Input dir="ltr" value={form.companyNameEn} onChange={(e) => set('companyNameEn', e.target.value)} placeholder="Al Jazirah Services" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>السجل التجاري (10 أرقام)</Label>
              <Input dir="ltr" className="num text-end" maxLength={10}
                value={form.crNumber} onChange={(e) => set('crNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="1010000000"
              />
            </div>
          </>
        )}

        {/* VAT — both account types, with explicit "not registered" option */}
        <div className="space-y-2">
          <Label>التسجيل في الضريبة (VAT)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set('vatChoice', 'REGISTERED')}
              className={cn(
                'p-3 rounded-lg border-2 text-start text-sm transition-colors',
                form.vatChoice === 'REGISTERED' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
              )}
            >
              <div className="font-semibold mb-0.5">مسجّل في الضريبة</div>
              <div className="text-xs text-muted-foreground">لديّ رقم ضريبي ساري (15 رقم)</div>
            </button>
            <button
              type="button"
              onClick={() => set('vatChoice', 'NOT_REGISTERED')}
              className={cn(
                'p-3 rounded-lg border-2 text-start text-sm transition-colors',
                form.vatChoice === 'NOT_REGISTERED' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
              )}
            >
              <div className="font-semibold mb-0.5">لا يوجد تسجيل ضريبي</div>
              <div className="text-xs text-muted-foreground">
                {isIndividual ? 'إيراداتك أقل من حد الإلزام (375,000 ر.س.)' : 'الشركة غير مُلزَمة حالياً'}
              </div>
            </button>
          </div>

          {form.vatChoice === 'REGISTERED' && (
            <div className="mt-2 space-y-1">
              <Label>الرقم الضريبي (15 رقم)</Label>
              <Input
                dir="ltr" className="num text-end" maxLength={15}
                value={form.vatNumber}
                onChange={(e) => set('vatNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="300000000000003"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>المدينة</Label>
            <Select value={form.city} onValueChange={(v) => set('city', v)}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>المنطقة</Label>
            <Select value={form.region} onValueChange={(v) => set('region', v)}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{isIndividual ? 'سنوات الخبرة في النقل' : 'سنوات النشاط'}</Label>
            <Select value={form.yearsInBusiness} onValueChange={(v) => set('yearsInBusiness', v)}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>{YEARS_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label><MapPin className="h-3.5 w-3.5 inline me-1" /> {isIndividual ? 'عنوان السكن' : 'عنوان المقر'} <span className="text-muted-foreground">— اختياري</span></Label>
          <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="الحي، الشارع، المبنى..." />
        </div>
      </div>
    </>
  );
}

// ─── Step 2: Fleet capacity ──────────────────────────────────────────

function StepFleet({
  form, set, toggleTruck, toggleRegion,
}: {
  form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void;
  toggleTruck: (id: string) => void; toggleRegion: (r: string) => void;
}) {
  const truckTypes = useTruckTypesStore((s) => s.types.filter((t) => t.active));
  return (
    <>
      <StepHeader icon={Briefcase} title="معلومات الخدمات" subtitle="ما هي قدراتك وتخصصاتك؟" />
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>حجم الموارد</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FLEET_SIZES.map((s) => (
              <button
                key={s.v}
                type="button"
                onClick={() => set('fleetSize', s.v)}
                className={cn(
                  'p-3 rounded-lg border-2 text-sm transition-colors',
                  form.fleetSize === s.v ? 'border-primary bg-primary/5 text-primary font-semibold' : 'border-border hover:border-primary/40',
                )}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>أنواع الخدمات المتوفرة</Label>
          <p className="text-xs text-muted-foreground">اختر كل الخدمات التي تقدمها (وفق كاتالوج المنصة)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {truckTypes.map((t) => {
              const on = form.truckTypes.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTruck(t.id)}
                  className={cn(
                    'group rounded-lg border-2 text-start transition-all relative overflow-hidden',
                    on ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-2 border-b">
                    {t.imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.imageUrl}
                          alt={t.nameAr}
                          className="max-h-full max-w-full object-contain drop-shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fb = target.nextElementSibling as HTMLElement;
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                        <div className="text-3xl items-center justify-center" style={{ display: 'none' }}>{t.icon}</div>
                      </>
                    ) : (
                      <div className="text-3xl">{t.icon}</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-semibold truncate">{t.nameAr}</span>
                      <span className="text-[10px] num text-muted-foreground shrink-0">{(t.capacityKg / 1000).toFixed(0)} طن</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{t.description}</p>
                  </div>
                  {on && (
                    <div className="absolute top-2 end-2 h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center shadow">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>المناطق التي تخدمها</Label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => {
              const on = form.primaryRegions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRegion(r)}
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

        <div className="space-y-3 pt-2 border-t">
          <Label>التجهيزات</Label>
          <ToggleRow label="نظام تتبع GPS" desc="على جميع الشاحنات" checked={form.hasGps} onChange={(v) => set('hasGps', v)} />
          <ToggleRow label="تأمين شامل" desc="على البضائع والشاحنات" checked={form.hasInsurance} onChange={(v) => set('hasInsurance', v)} />
        </div>
      </div>
    </>
  );
}

function ToggleRow({ label, desc, checked, onChange, icon: Icon }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; icon?: any }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── Step 3: Compliance docs ─────────────────────────────────────────

function StepDocs({
  form, set, docsList,
}: {
  form: Form;
  set: <K extends keyof Form>(k: K, v: Form[K]) => void;
  docsList: Array<{ id: string; label: string; required: boolean; vatOnly?: boolean }>;
}) {
  const handleFile = (id: string, files: FileList | null) => {
    const file = files?.[0] ?? null;
    set('docs', { ...form.docs, [id]: file });
  };
  const isIndividual = form.accountType === 'INDIVIDUAL';
  return (
    <>
      <StepHeader
        icon={FileCheck2}
        title="المستندات والاعتماد"
        subtitle={
          isIndividual
            ? 'المطلوب للأفراد وفق أنظمة هيئة النقل العام (TGA)'
            : 'المطلوب للشركات وفق المواصفات الحكومية'
        }
      />
      <div className="space-y-3">
        {docsList.map((d) => {
          const file = form.docs[d.id];
          return (
            <div key={d.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('h-10 w-10 rounded-lg grid place-items-center shrink-0', file ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground')}>
                    {file ? <Check className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{d.label}</span>
                      {d.required && <Badge variant="destructive" className="text-[10px]">إلزامي</Badge>}
                    </div>
                    {file ? (
                      <div className="text-xs text-success font-mono truncate" dir="ltr">{file.name}</div>
                    ) : (
                      <div className="text-xs text-muted-foreground">PDF, JPG حتى 5 ميغابايت</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {file ? (
                    <Button size="sm" variant="ghost" onClick={() => set('docs', { ...form.docs, [d.id]: null })}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <label>
                      <Button asChild size="sm" variant="outline">
                        <span className="cursor-pointer">
                          <Upload className="h-3.5 w-3.5" /> رفع
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => handleFile(d.id, e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Step 4: Bank info ───────────────────────────────────────────────

function StepBank({
  form, set,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  return (
    <>
      <StepHeader icon={Building2} title="الحساب البنكي" subtitle="حتى نتمكن من تحويل أرباحك بعد كل طلب" />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>اسم صاحب الحساب</Label>
          <Input value={form.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} placeholder="مثل ما هو مسجّل في البنك" />
        </div>

        <div className="space-y-2">
          <Label>البنك</Label>
          <Select value={form.bankName} onValueChange={(v) => set('bankName', v)}>
            <SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger>
            <SelectContent>{BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>رقم IBAN (24 خانة)</Label>
          <Input
            dir="ltr"
            className="num text-end font-mono"
            value={form.iban}
            onChange={(e) => set('iban', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24))}
            placeholder="SA0000000000000000000000"
            maxLength={24}
          />
          <p className="text-xs text-muted-foreground">يبدأ بـ SA ويتبعه 22 رقم</p>
        </div>

        <div className="rounded-lg bg-info/10 border border-info/30 p-3 flex items-start gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            يُستخدم هذا الحساب فقط لتحويل أرباحك. لن نخصم منه أي مبالغ. سيتم التحقق من تطابق اسم الحساب مع اسم الشركة في السجل التجاري.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Step 5: Verification + Terms ────────────────────────────────────

function StepVerify({
  form, set,
}: { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  return (
    <>
      <StepHeader icon={ShieldCheck} title="التحقّق والتقديم" subtitle="آخر خطوة قبل مراجعة طلبك" />
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>رمز البريد (للتجربة: <span className="font-mono text-primary">1234</span>)</Label>
            <OtpInput value={form.emailOtp} onChange={(v) => set('emailOtp', v)} />
          </div>
          <div className="space-y-2">
            <Label>رمز الجوال (للتجربة: <span className="font-mono text-primary">5678</span>)</Label>
            <OtpInput value={form.phoneOtp} onChange={(v) => set('phoneOtp', v)} />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 mb-3">
            <p className="text-sm font-semibold">قبل إتمام التسجيل</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              يرجى قراءة والموافقة على المستندات التالية. لا يمكن إتمام التسجيل بدون الموافقة على جميع الشروط.
            </p>
          </div>

          <ConsentRow checked={form.acceptTerms}     onChange={(v) => set('acceptTerms', v)}     label="أوافق على شروط الاستخدام"        href={`${process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3000'}/terms`} />
          <ConsentRow checked={form.acceptPrivacy}   onChange={(v) => set('acceptPrivacy', v)}   label="أوافق على سياسة الخصوصية"        href={`${process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3000'}/privacy`} />
          <ConsentRow checked={form.acceptTransport} onChange={(v) => set('acceptTransport', v)} label="أوافق على شروط وأحكام النقل"      href={`${process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3000'}/transport`} />

          <label className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer">
            <input type="checkbox" checked={form.acceptCommission} onChange={(e) => set('acceptCommission', e.target.checked)} className="mt-0.5 h-4 w-4" />
            <span className="text-sm leading-relaxed">
              أوافق على{' '}
              <strong>نسبة العمولة 8%</strong>
              {' '}من قيمة كل طلب يتمّ من خلال المنصة
            </span>
          </label>
        </div>

        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 flex items-start gap-2 text-sm">
          <FileCheck2 className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-warning-foreground">ماذا بعد التقديم؟</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              يراجع فريق الامتثال طلبك خلال 24 – 48 ساعة عمل. سيصلك إشعار بالقبول/الرفض على البريد والجوال.
            </p>
          </div>
        </div>
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
          className="h-12 w-12 rounded-lg border-2 bg-card text-center text-xl font-bold num focus:border-primary focus:outline-none"
        />
      ))}
    </div>
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
