'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowLeft, ArrowDown, BadgeCheck, Briefcase, Building2, CheckCircle2,
  ChevronDown, Clock, Headphones, Lock, MapPin, Menu, Package, Quote,
  Radio, ShieldCheck, Star, ThumbsUp, TrendingUp, UserSearch, Users,
  Wallet, X, Zap,
} from 'lucide-react';

const CLIENT_URL  = process.env.NEXT_PUBLIC_CLIENT_URL  ?? 'http://localhost:3002';
const CARRIER_URL = process.env.NEXT_PUBLIC_CARRIER_URL ?? 'http://localhost:3003';

// ── Data ───────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Radio,       title: 'عروض تنافسية شفافة',        desc: 'مزاد مفتوح أو إسناد مباشر — قارن الأسعار واختر الأنسب لطبيعة طلبك.',           color: '#3B82F6' },
  { icon: Wallet,      title: 'دفع آمن بنظام Escrow',       desc: 'المبلغ محجوز في حساب وسيط ولا يُحوَّل للمزوّد إلا بعد تأكيد استلامك للخدمة.',  color: '#10B981' },
  { icon: ShieldCheck, title: 'مزوّدون موثّقون KYC',        desc: 'سجل تجاري، تراخيص، وتقييمات حقيقية — كل مزوّد تم التحقق منه بصرامة.',          color: '#F59E0B' },
  { icon: MapPin,      title: 'تتبّع تقدّم الطلب',          desc: 'راقب حالة خدمتك لحظةً بلحظة من البداية حتى التسليم الكامل.',                    color: '#8B5CF6' },
  { icon: Headphones,  title: 'دعم متخصص على مدار الساعة',  desc: 'فريق دعم لحل النزاعات، معالجة التذاكر، والمتابعة ٢٤/٧ بدون استثناء.',         color: '#EC4899' },
  { icon: TrendingUp,  title: 'تقارير وتحليلات متكاملة',    desc: 'لوحة شاملة لكل طلب ومصروف — اتخذ قرارات أذكى مبنية على بيانات حقيقية.',       color: '#00C9A7' },
];

const CLIENT_STEPS = [
  { num: '١', title: 'أنشئ طلب خدمة',        desc: 'حدّد احتياجك، نوع الخدمة، الميزانية، والموقع في خطوات بسيطة وسريعة.' },
  { num: '٢', title: 'استقبل عروض المزوّدين', desc: 'قارن الأسعار والتقييمات وتواصل مع المزوّدين المعتمدين مباشرةً.' },
  { num: '٣', title: 'اختر وادفع بأمان',      desc: 'اقبل العرض الأنسب — المبلغ محمي بنظام Escrow حتى اكتمال الخدمة.' },
  { num: '٤', title: 'استلم وأقيّم',          desc: 'تأكيد استلامك يُفرج عن المبلغ تلقائياً ويُسجَّل تقييمك للمزوّد.' },
];

const PROVIDER_STEPS = [
  { num: '١', title: 'سجّل وتحقق',           desc: 'أدخل السجل التجاري والتراخيص — نتحقق من بياناتك خلال ٢٤ ساعة.' },
  { num: '٢', title: 'استعرض الطلبات',       desc: 'تصفّح عشرات الطلبات المتاحة في منطقتك وتخصصك يومياً.' },
  { num: '٣', title: 'قدّم عرضك',            desc: 'أرسل السعر والجدول الزمني — بسرعة من الجوال أو الويب.' },
  { num: '٤', title: 'أتمم واستلم مالك',     desc: 'أنجز الخدمة وأكّد الإنجاز — مدفوعاتك أسبوعياً بتحويل بنكي.' },
];

const TESTIMONIALS = [
  {
    name: 'خالد الشمري',
    role: 'مدير المشتريات · شركة التقنية المتقدمة، الرياض',
    quote: 'وفّرنا ٣٠٪ من تكلفة الاستشارات في الربع الأول — نِطاق غيّر طريقة تعاملنا مع مزوّدي الخدمات كلياً.',
    type: 'client',
  },
  {
    name: 'أحمد القحطاني',
    role: 'مهندس معتمد · مقدّم خدمة على نِطاق',
    quote: 'زاد دخلي الشهري ٤٥٪ منذ الانضمام — الطلبات حقيقية والمدفوعات منتظمة بدون أي تأخير.',
    type: 'provider',
  },
  {
    name: 'نورا السبيعي',
    role: 'مدير العمليات · مجموعة الوطن التجارية، جدة',
    quote: 'كنا نعاني من صعوبة إيجاد فنيين معتمدين — الآن نجد المزوّد المناسب خلال ساعات وبتقييمات موثّقة.',
    type: 'client',
  },
];

const STATS = [
  { raw: 500,   suffix: '+', label: 'مزوّد معتمد',       Icon: BadgeCheck,   color: '#00C9A7' },
  { raw: 12000, suffix: '+', label: 'طلب خدمة منجز',     Icon: CheckCircle2, color: '#3B82F6', displayValue: '12K+' },
  { raw: 98,    suffix: '%', label: 'معدّل رضا العملاء', Icon: ThumbsUp,     color: '#F59E0B', displayValue: '98.4%' },
  { raw: 15,    suffix: '',  label: 'مدينة سعودية',      Icon: MapPin,       color: '#8B5CF6' },
];

const FAQ_ITEMS = [
  { q: 'هل التسجيل في نِطاق مجاني؟',           a: 'نعم، التسجيل وإنشاء الطلبات مجاني تماماً للعملاء. مقدّم الخدمة يدفع عمولة ٨٪ فقط عند إتمام الصفقة بنجاح، لا اشتراك ولا رسوم مسبقة.' },
  { q: 'كيف يعمل نظام الدفع الآمن Escrow؟',    a: 'عند قبول عرض مزوّد الخدمة، يُحجز المبلغ في حساب وسيط آمن. لا يُحوَّل للمزوّد إلا بعد تأكيدك باستلام الخدمة وموافقتك على جودتها — مالك محمي بالكامل.' },
  { q: 'كيف يتم التحقق من مزوّدي الخدمة؟',    a: 'كل مزوّد يخضع لعملية KYC شاملة: سجل تجاري، وثائق ترخيص، هوية وطنية، وتحقق من التخصص. التقييمات المعروضة من عملاء حقيقيين مؤكَّدين فقط.' },
  { q: 'متى يستلم مقدّم الخدمة مدفوعاته؟',    a: 'تُحوَّل المدفوعات أسبوعياً لحساب مقدّم الخدمة البنكي، بعد تأكيد إنجاز الطلبات من قِبل العملاء. لا تأخير ولا رسوم إضافية على التحويل.' },
  { q: 'ماذا يحدث في حالة الخلاف؟',           a: 'فريق دعم نِطاق يتولى الوساطة في حل النزاعات بشفافية. المبلغ المحجوز في Escrow يبقى محمياً حتى حل الخلاف بشكل عادل للطرفين.' },
  { q: 'هل يمكنني الانضمام كفرد وليس شركة؟', a: 'نعم، يمكن للأفراد الانضمام كمقدّمي خدمة بشرط وجود سجل تجاري أو بيانات هوية معتمدة. كما يمكن للأفراد إنشاء طلبات خدمة مجاناً.' },
];

const NAV = [
  { href: '#features', label: 'المميزات' },
  { href: '#how',      label: 'كيف نعمل' },
  { href: '#pricing',  label: 'الأسعار' },
  { href: '#faq',      label: 'الأسئلة الشائعة' },
];

// ── Animation vars ─────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};
const stagger = { show: { transition: { staggerChildren: 0.09 } } };

// ── Sub-components ─────────────────────────────────────────────────────────────
function useCounter(target: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cur = 0;
    const step = target / 70;
    const id = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.round(cur));
    }, 18);
    return () => clearInterval(id);
  }, [target, active]);
  return count;
}

function StatCard({ raw, suffix, label, Icon, color, displayValue }: {
  raw: number; suffix: string; label: string;
  Icon: React.ElementType; color: string; displayValue?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const count = useCounter(raw, inView);
  const display = displayValue && count >= raw
    ? displayValue
    : raw >= 1000
      ? `${(count / 1000).toFixed(count >= raw ? 0 : 1)}K${suffix}`
      : `${count}${suffix}`;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center gap-3 px-4"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${color}18` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="text-4xl sm:text-5xl font-extrabold tabular-nums" style={{ color }}>{display}</div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color, index }: {
  icon: React.ElementType; title: string; desc: string; color: string; index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -6, boxShadow: `0 24px 48px -12px ${color}28` }}
      className="group rounded-2xl border bg-card p-6 cursor-default transition-all duration-300 relative overflow-hidden"
    >
      <div
        className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <motion.div
        whileHover={{ scale: 1.1, rotate: -6 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="flex h-12 w-12 items-center justify-center rounded-xl mb-5"
        style={{ background: `${color}15`, color }}
      >
        <Icon className="h-6 w-6" />
      </motion.div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StepCard({ num, title, desc, index, total, color }: {
  num: string; title: string; desc: string; index: number; total: number; color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <div ref={ref} className="relative flex flex-col items-center text-center px-4">
      {index < total - 1 && (
        <div className="absolute top-7 start-[calc(50%+36px)] end-[-calc(50%-36px)] h-[2px] hidden lg:block overflow-hidden bg-border">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="h-full w-full"
            style={{ transformOrigin: '100% 50%', background: `${color}60` }}
          />
        </div>
      )}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200, delay: index * 0.12 }}
        className="flex h-14 w-14 items-center justify-center rounded-full font-extrabold text-2xl mb-5 z-10 shrink-0 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)` }}
      >
        {num}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: index * 0.12 + 0.15 }}
      >
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </motion.div>
    </div>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <section ref={ref} id="faq" className="py-24 bg-muted/30 border-y">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <motion.div
          variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
            الأسئلة الشائعة
          </motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">أسئلة تدور في ذهنك؟</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">إجابات واضحة على أكثر ما يسأل عنه عملاؤنا.</motion.p>
        </motion.div>
        <div className="max-w-2xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-start font-semibold hover:bg-muted/40 transition-colors"
              >
                <span className="text-sm sm:text-base">{item.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 text-muted-foreground"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' as const }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t pt-4">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [howTab, setHowTab] = useState<'client' | 'provider'>('client');

  const statsRef    = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const howRef      = useRef<HTMLElement>(null);
  const audRef      = useRef<HTMLElement>(null);
  const testimRef   = useRef<HTMLElement>(null);
  const pricingRef  = useRef<HTMLElement>(null);
  const ctaRef      = useRef<HTMLElement>(null);

  const statsInView    = useInView(statsRef,    { once: true, margin: '-60px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-60px' });
  const howInView      = useInView(howRef,      { once: true, margin: '-60px' });
  const audInView      = useInView(audRef,      { once: true, margin: '-60px' });
  const testimInView   = useInView(testimRef,   { once: true, margin: '-60px' });
  const pricingInView  = useInView(pricingRef,  { once: true, margin: '-60px' });
  const ctaInView      = useInView(ctaRef,      { once: true, margin: '-60px' });

  const steps = howTab === 'client' ? CLIENT_STEPS : PROVIDER_STEPS;
  const stepColor = howTab === 'client' ? '#00C9A7' : '#3B82F6';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-border/50"
        style={{ background: 'hsl(var(--background) / 0.88)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-[1280px] mx-auto h-16 px-4 sm:px-6 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #00C9A7 100%)' }}>
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight">نِطاق</span>
              <span className="hidden sm:block text-[10px] text-muted-foreground mt-0.5">منصة الخدمات الذكية</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 ms-8">
            {NAV.map(l => (
              <a key={l.href} href={l.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <Link href={`${CLIENT_URL}/login`} className="hidden sm:block">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                دخول العميل
              </motion.button>
            </Link>
            <Link href={`${CARRIER_URL}/login`}>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0,201,167,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #00C9A7 100%)' }}
              >
                دخول المزوّد
              </motion.button>
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors ms-1"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="القائمة"
            >
              <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' as const }}
              className="md:hidden overflow-hidden border-t bg-background"
            >
              <nav className="px-4 py-4 space-y-1">
                {NAV.map(l => (
                  <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    {l.label}
                  </a>
                ))}
                <div className="pt-3 border-t mt-2 grid grid-cols-2 gap-2">
                  <Link href={`${CLIENT_URL}/login`}>
                    <button className="w-full py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                      دخول العميل
                    </button>
                  </Link>
                  <Link href={`${CARRIER_URL}/login`}>
                    <button className="w-full py-2.5 text-sm font-semibold rounded-lg text-white"
                      style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #00C9A7 100%)' }}>
                      دخول المزوّد
                    </button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center py-16">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,201,167,0.12) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 90% 70%, rgba(13,92,87,0.1) 0%, transparent 55%)',
          }} />
          <motion.div
            animate={{ scale: [1, 1.15, 1], x: [0, 24, 0], y: [0, -18, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 start-[5%] h-96 w-96 rounded-full pointer-events-none"
            style={{ background: '#00C9A7', filter: 'blur(90px)', opacity: 0.07 }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], x: [0, -22, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute bottom-10 end-[4%] h-[480px] w-[480px] rounded-full pointer-events-none"
            style={{ background: '#0D5C57', filter: 'blur(110px)', opacity: 0.07 }}
          />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.022,
          }} />
        </div>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Text side */}
            <motion.div variants={stagger} initial="hidden" animate="show" className="text-start">
              <motion.span variants={fadeUp}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-primary/25 bg-primary/8 text-primary mb-6">
                <Zap className="h-3 w-3" />
                منصة الخدمات المعتمدة · المملكة العربية السعودية
              </motion.span>

              <motion.h1 variants={fadeUp}
                className="text-[42px] sm:text-[56px] lg:text-[64px] leading-[1.08] font-extrabold tracking-tight">
                وفّر وقتك ومالك مع{' '}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text"
                    style={{ backgroundImage: 'linear-gradient(135deg, #00C9A7 0%, #059669 100%)' }}>
                    مزوّدين معتمدين
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' as const }}
                    className="absolute -bottom-1 start-0 end-0 h-[3px] rounded-full"
                    style={{ background: 'linear-gradient(90deg, #00C9A7, transparent)', transformOrigin: '100% 50%' }}
                  />
                </span>
              </motion.h1>

              <motion.p variants={fadeUp}
                className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                منصة <strong className="text-foreground font-semibold">نِطاق</strong> تربط شركتك ومؤسستك بمئات مقدّمي الخدمات الموثّقين —
                عروض شفافة، دفع آمن بـ Escrow، وتقييمات حقيقية من عملاء فعليين.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp}
                className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                <Link href={`${CLIENT_URL}/login`}>
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(0,201,167,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #00C9A7 100%)' }}
                  >
                    <Briefcase className="h-4 w-4" />
                    ابدأ مجاناً — للشركات
                  </motion.button>
                </Link>
                <Link href={`${CARRIER_URL}/login`}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted/60 transition-colors"
                  >
                    <UserSearch className="h-4 w-4" />
                    انضم كمزوّد خدمة
                  </motion.button>
                </Link>
              </motion.div>

              {/* Trust badges */}
              <motion.div variants={fadeUp}
                className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
                {[
                  { icon: Lock,       text: 'دفع Escrow مضمون' },
                  { icon: BadgeCheck, text: 'مزوّدون موثّقون' },
                  { icon: Clock,      text: 'دعم ٢٤/٧' },
                  { icon: Zap,        text: 'مجاني للعملاء' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-emerald-500" />
                    <span>{text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Dashboard mockup side */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.8, ease: 'easeOut' as const }}
              className="relative hidden lg:block"
            >
              {/* Main card */}
              <div className="rounded-2xl border border-border/60 overflow-hidden shadow-2xl"
                style={{ background: 'hsl(var(--card))' }}>
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="h-3 w-3 rounded-full bg-red-400/70" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                  <div className="h-3 w-3 rounded-full bg-green-400/70" />
                  <div className="ms-3 flex-1 rounded-md bg-muted h-5 max-w-[160px] flex items-center px-2">
                    <span className="text-[10px] text-muted-foreground font-mono">dashboard.nitaq.sa</span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Greeting row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">مرحباً، شركة المستقبل 👋</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">الثلاثاء، ٢٧ مايو ٢٠٢٥</div>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary grid place-items-center text-sm font-bold">م</div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: 'طلبات نشطة', val: '٢٤',  color: '#00C9A7' },
                      { label: 'منجزة هذا الشهر', val: '١٢٨', color: '#3B82F6' },
                      { label: 'التوفير المحقق', val: '٢٢٪', color: '#F59E0B' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center"
                        style={{ background: `${s.color}12`, border: `1px solid ${s.color}28` }}>
                        <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Orders */}
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground mb-2">آخر الطلبات</div>
                    <div className="space-y-2.5">
                      {[
                        { id: '١٠٢٤', service: 'صيانة تقنية',    pct: 65,  color: '#00C9A7', status: 'جارٍ' },
                        { id: '١٠٢٣', service: 'تركيب وتجميع',  pct: 90,  color: '#3B82F6', status: 'قارب' },
                        { id: '١٠٢٢', service: 'استشارة إدارية', pct: 100, color: '#10B981', status: 'منجز' },
                      ].map(r => (
                        <div key={r.id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-medium">طلب #{r.id} · {r.service}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: `${r.color}20`, color: r.color }}>
                              {r.status}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${r.pct}%` }}
                              transition={{ delay: 1 + r.pct / 200, duration: 1.1, ease: 'easeOut' as const }}
                              className="h-full rounded-full"
                              style={{ background: r.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Incoming offers */}
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground mb-2">عروض واردة · طلب #١٠٢٥</div>
                    <div className="space-y-1.5">
                      {[
                        { name: 'أحمد العمري',  rating: '٤.٩', price: '٢٨٠ ر.س', best: true },
                        { name: 'شركة النخبة', rating: '٤.٧', price: '٣١٠ ر.س', best: false },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20">
                          <div className="h-7 w-7 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold shrink-0">
                            {p.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium flex items-center gap-1">
                              {p.name}
                              {p.best && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-semibold">الأفضل</span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">⭐ {p.rating}</div>
                          </div>
                          <div className="text-xs font-bold text-primary shrink-0">{p.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-5 -end-5 flex items-center gap-2 rounded-xl px-3 py-2.5 shadow-xl text-xs font-semibold"
                style={{ background: '#00C9A7', color: '#fff' }}
              >
                <CheckCircle2 className="h-4 w-4" />
                اكتمل التنفيذ · طلب #١٠٢٢
              </motion.div>

              <motion.div
                animate={{ y: [0, 7, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute -bottom-5 -start-5 flex items-center gap-2 rounded-xl px-3 py-2.5 shadow-xl text-xs font-semibold border border-border"
                style={{ background: 'hsl(var(--background))' }}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                ١٢ مزوّد يتنافسون الآن
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex justify-center mt-16"
          >
            <a href="#stats" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <ArrowDown className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section id="stats" ref={statsRef} className="border-y bg-card">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 divide-x divide-x-reverse divide-border">
            {STATS.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section ref={featuresRef} id="features" className="py-24">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger} initial="hidden" animate={featuresInView ? 'show' : 'hidden'}
            className="text-center mb-14 max-w-2xl mx-auto"
          >
            <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              لماذا نِطاق؟
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">كل ما تحتاجه لإدارة خدماتك</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">من تقديم الطلب حتى الإنجاز — كل خطوة محسوبة ومؤمّنة.</motion.p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── How it works (tabbed) ────────────────────────────────────────────── */}
      <section ref={howRef} id="how" className="py-24 bg-muted/30 border-y">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger} initial="hidden" animate={howInView ? 'show' : 'hidden'}
            className="text-center mb-12 max-w-2xl mx-auto"
          >
            <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              كيف نعمل
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">٤ خطوات وخدمتك على الطريق</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">بدون مكالمات لا نهائية أو مفاجآت في الأسعار — عملية مبسّطة وشفافة.</motion.p>
          </motion.div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-xl border bg-card p-1 shadow-sm">
              {[
                { key: 'client',   label: 'أنا شركة / عميل', Icon: Building2 },
                { key: 'provider', label: 'أنا مزوّد خدمة',  Icon: UserSearch },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setHowTab(tab.key as 'client' | 'provider')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    howTab === tab.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={howTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-4 relative"
            >
              {steps.map((s, i) => (
                <StepCard key={s.num} {...s} index={i} total={steps.length} color={stepColor} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Audiences ───────────────────────────────────────────────────────── */}
      <section ref={audRef} className="py-24">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger} initial="hidden" animate={audInView ? 'show' : 'hidden'}
            className="text-center mb-14 max-w-2xl mx-auto"
          >
            <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              لمن نِطاق؟
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">منصة مصمّمة للطرفين</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">سواء كنت تبحث عن خدمة أو تقدّمها — نِطاق يخدمك.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client card */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={audInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border bg-card p-8 sm:p-10 flex flex-col"
            >
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl mb-5"
                style={{ background: '#3B82F615', width: 52, height: 52 }}>
                <Building2 className="h-6 w-6" style={{ color: '#3B82F6' }} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 mb-3 self-start">
                للشركات والأفراد
              </div>
              <h3 className="text-2xl font-bold mb-3">أنت تطلب الخدمة</h3>
              <p className="text-base text-muted-foreground mb-6">وفّر وقتك ومال شركتك — مزوّدون معتمدون وأسعار تنافسية بضمان كامل على مدفوعاتك.</p>
              <ul className="space-y-3 flex-1">
                {[
                  'انشر طلب خدمة في دقائق واحصل على عروض متعددة',
                  'قارن السعر والتقييم والخبرة قبل الاختيار',
                  'ادفع عبر Escrow الآمن — مالك محمي حتى التسليم',
                  'تابع تنفيذ طلبك لحظياً وأكّد الإنجاز بنفسك',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link href={`${CLIENT_URL}/login`}
                className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold text-primary hover:underline self-start">
                ابدأ مجاناً
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </motion.div>

            {/* Provider card */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={audInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl relative overflow-hidden p-8 sm:p-10 text-white flex flex-col"
              style={{ background: 'linear-gradient(140deg, #0A3D3A 0%, #0D5C57 55%, #00C9A7 140%)' }}
            >
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }} />
              <div className="relative flex flex-col flex-1">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 mb-5"
                  style={{ width: 52, height: 52 }}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20 mb-3 self-start">
                  للشركات والأفراد
                </div>
                <h3 className="text-2xl font-bold mb-3">أنت تقدّم الخدمة</h3>
                <p className="text-base text-white/80 mb-6">طلبات حقيقية يومياً، إدارة كاملة لأعمالك، وتحصيل مضمون أسبوعياً بدون تأخير.</p>
                <ul className="space-y-3 flex-1">
                  {[
                    'استكشف عشرات الفرص المتاحة في منطقتك',
                    'قدّم عروضك بسرعة من الجوال أو الويب',
                    'أدِر موظفيك وخدماتك من لوحة تحكم واحدة',
                    'استلم مدفوعاتك أسبوعياً بتحويل بنكي مباشر',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-white/90">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`${CARRIER_URL}/login`}
                  className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold hover:underline self-start">
                  انضم كمزوّد خدمة
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section ref={testimRef} className="py-24 bg-muted/30 border-y">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger} initial="hidden" animate={testimInView ? 'show' : 'hidden'}
            className="text-center mb-14 max-w-2xl mx-auto"
          >
            <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              آراء عملائنا
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">ثقة بنيناها صفقة بعد أخرى</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">مئات الشركات والأفراد يثقون في نِطاق يومياً.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={testimInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 20px 48px -12px rgba(0,0,0,0.1)' }}
                className="rounded-2xl border bg-card p-6 flex flex-col transition-all duration-300"
              >
                <Quote className="h-7 w-7 text-primary/25 mb-4 shrink-0" />
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 pt-5 border-t">
                  <div className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center font-semibold text-sm shrink-0">
                    {t.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.role}</div>
                  </div>
                  <span className={`ms-auto text-[10px] px-2 py-1 rounded-full font-semibold shrink-0 ${
                    t.type === 'client'
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {t.type === 'client' ? 'عميل' : 'مزوّد'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section ref={pricingRef} id="pricing" className="py-24">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger} initial="hidden" animate={pricingInView ? 'show' : 'hidden'}
            className="text-center mb-14 max-w-2xl mx-auto"
          >
            <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              التسعير
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">بسيط وشفاف — بلا مفاجآت</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">عمولة على قيمة الصفقة عند نجاحها فقط. لا اشتراك شهري. لا رسوم خفية.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              {
                title: 'للعميل',
                value: 'مجاناً',
                sub: 'لا تدفع للمنصة شيئاً',
                items: ['إنشاء طلبات غير محدودة', 'استقبال عروض المزوّدين', 'دفع Escrow مضمون', 'دعم فني كامل'],
                featured: false,
              },
              {
                title: 'للمزوّد',
                value: '٨٪',
                sub: 'من قيمة كل صفقة ناجحة',
                items: ['تسجيل مجاني', 'وصول لجميع الطلبات', 'لوحة إدارة متكاملة', 'مدفوعات أسبوعية'],
                featured: true,
              },
              {
                title: 'ضريبة القيمة المضافة',
                value: '١٥٪',
                sub: 'على العمولة فقط (VAT)',
                items: ['مطبّقة على العمولة ٨٪', 'لا ضريبة على قيمة الخدمة', 'فاتورة ضريبية مفصّلة', 'متوافق مع اشتراطات ZATCA'],
                featured: false,
              },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={p.featured
                  ? { scale: 1.03, boxShadow: '0 0 48px rgba(0,201,167,0.25)' }
                  : { y: -4 }}
                className={`rounded-2xl p-7 flex flex-col transition-shadow ${
                  p.featured
                    ? 'text-white shadow-xl relative overflow-hidden'
                    : 'border bg-card'
                }`}
                style={p.featured
                  ? { background: 'linear-gradient(140deg, #0A3D3A 0%, #00C9A7 120%)' }
                  : {}}
              >
                {p.featured && (
                  <div className="absolute inset-0 opacity-[0.06]" style={{
                    backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }} />
                )}
                <div className="relative">
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white mb-3">
                      الأكثر شيوعاً
                    </span>
                  )}
                  <div className={`text-sm font-semibold mb-3 ${p.featured ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {p.title}
                  </div>
                  <div className={`text-5xl font-extrabold mb-1 ${p.featured ? 'text-white' : ''}`}>{p.value}</div>
                  <div className={`text-sm mb-6 ${p.featured ? 'text-white/70' : 'text-muted-foreground'}`}>{p.sub}</div>
                  <ul className="space-y-2.5">
                    {p.items.map(item => (
                      <li key={item} className={`flex items-center gap-2 text-sm ${p.featured ? 'text-white/90' : ''}`}>
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${p.featured ? 'text-emerald-300' : 'text-emerald-500'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section ref={ctaRef} id="contact" className="py-20 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden text-white text-center p-12 sm:p-16"
            style={{ background: 'linear-gradient(140deg, #0A3D3A 0%, #0D5C57 50%, #00C9A7 110%)' }}
          >
            {/* Shimmer */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.5 }}
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)' }}
            />
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-sm font-semibold mb-6">
                <Zap className="h-4 w-4" />
                انضم الآن — التسجيل مجاني
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">ابدأ مجاناً اليوم</h2>
              <p className="mt-4 text-base text-white/80 max-w-xl mx-auto">
                انضم لآلاف الشركات السعودية التي تدير خدماتها عبر نِطاق — سجّل خلال دقيقتين وابدأ فوراً.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href={`${CLIENT_URL}/login`}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 28px rgba(255,255,255,0.22)' }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-white text-primary"
                  >
                    <Briefcase className="h-4 w-4" />
                    ابدأ مجاناً — للشركات
                  </motion.button>
                </Link>
                <Link href={`${CARRIER_URL}/login`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors"
                  >
                    <UserSearch className="h-4 w-4" />
                    انضم كمزوّد خدمة
                  </motion.button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/50">لا بطاقة ائتمانية · لا اشتراك · ابدأ فوراً</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-card border-t">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-12 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #00C9A7 100%)' }}>
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-extrabold">نِطاق</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                منصة الخدمات الذكية في المملكة — نربط الشركات والأفراد بأفضل مقدّمي الخدمات بشفافية كاملة وأسعار تنافسية.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['نِطاق · الرياض', 'جدة', 'الدمام', '+١٢ مدينة'].map(c => (
                  <span key={c} className="text-xs px-2.5 py-1 rounded-full border bg-muted/50 text-muted-foreground">{c}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">المنصة</h4>
              <ul className="space-y-2.5 text-sm">
                {[['#features', 'المميزات'], ['#how', 'كيف نعمل'], ['#pricing', 'التسعير'], ['#faq', 'الأسئلة الشائعة']].map(([h, l]) => (
                  <li key={l}><a href={h} className="text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">الشركة</h4>
              <ul className="space-y-2.5 text-sm">
                {[['/about', 'عن نِطاق'], ['/contact', 'تواصل معنا'], ['/privacy', 'سياسة الخصوصية'], ['/terms', 'الشروط والأحكام'], ['/transport', 'شروط الخدمة']].map(([h, l]) => (
                  <li key={l}><Link href={h} className="text-muted-foreground hover:text-foreground transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} نِطاق · جميع الحقوق محفوظة</span>
            <div className="flex items-center gap-4">
              <Link href={`${CLIENT_URL}/login`} className="hover:text-foreground transition-colors">بوابة العملاء</Link>
              <Link href={`${CARRIER_URL}/login`} className="hover:text-foreground transition-colors">بوابة المزوّدين</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
