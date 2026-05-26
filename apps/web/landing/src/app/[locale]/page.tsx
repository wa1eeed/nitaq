'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowLeft, Briefcase, CheckCircle2, MapPin, Menu, Package, Quote,
  Radio, ShieldCheck, Star, UserSearch, Wallet, X, Zap,
  Lock, Clock, TrendingUp,
} from 'lucide-react';

// ── Env ────────────────────────────────────────────────────────────────────────
const CLIENT_URL  = process.env.NEXT_PUBLIC_CLIENT_URL  ?? 'http://localhost:3002';
const CARRIER_URL = process.env.NEXT_PUBLIC_CARRIER_URL ?? 'http://localhost:3003';

// ── Data ───────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Radio,       title: 'سوق مفتوح للعروض',        desc: 'انشر طلبك وادع عشرات مقدّمي الخدمة المعتمدين للتقديم بأسعار تنافسية في دقائق.' },
  { icon: UserSearch,  title: 'إسناد مباشر لمقدّم خدمة', desc: 'لديك مزوّد مفضّل؟ أرسل له الطلب مباشرة ويقبل أو يقترح سعراً بديلاً.' },
  { icon: MapPin,      title: 'متابعة لحظية للتنفيذ',    desc: 'تابع تقدّم خدمتك لحظةً بلحظة من بدء التنفيذ حتى الإنجاز الكامل.' },
  { icon: Wallet,      title: 'مدفوعات Escrow الآمنة',   desc: 'تُحتجَز أموالك في حساب وسيط ولا تُحوَّل لمقدّم الخدمة إلا بعد تأكيد الإنجاز.' },
  { icon: ShieldCheck, title: 'مزوّدون موثّقون فقط',     desc: 'كل شركة خدمات تخضع لتحقّق KYC: سجل تجاري، وثائق الترخيص، وتقييمات حقيقية.' },
  { icon: Star,        title: 'نظام تقييم شفّاف',        desc: 'قيّم مقدّمي الخدمة بعد كل طلب، واطّلع على تقييمات الآخرين قبل اختيارك.' },
];

const STEPS = [
  { num: '١', title: 'أنشئ طلبك',        desc: 'صف الخدمة التي تحتاجها، حدّد الموقع والميزانية في 5 خطوات بسيطة.' },
  { num: '٢', title: 'استقبل العروض',    desc: 'يقدّم مقدّمو خدمة معتمدون عروضهم — قارن السعر، التقييم، والمدة.' },
  { num: '٣', title: 'اختر وادفع',       desc: 'يُحتجَز المبلغ في Escrow حتى الإنجاز. لا مفاجآت ولا رسوم خفيّة.' },
  { num: '٤', title: 'تابع وأكّد الإنجاز', desc: 'راقب تقدّم الخدمة لحظياً. عند التأكيد يُفرَج المبلغ لمقدّم الخدمة تلقائياً.' },
];

const TESTIMONIALS = [
  { name: 'وليد الحربي',  role: 'مدير المشتريات · شركة الجزيرة للطاقة',    quote: 'وفّرنا ٢٢٪ من تكاليف الخدمات خلال شهرين، مع شفافية كاملة في كل طلب.' },
  { name: 'سارة العمري',  role: 'مدير عمليات · مؤسسة الواحة للأغذية',      quote: 'متابعة التنفيذ اللحظية أنقذتنا من تأخيرات كثيرة — نعرف حالة طلباتنا دائماً.' },
  { name: 'فهد الدوسري',  role: 'مدير · شركة المسار للخدمات المتكاملة',    quote: 'منصّة سهلة تجلب لنا طلبات حقيقية يومياً، والتحصيل يصل لحسابنا أسبوعياً.' },
];

const STATS = [
  { raw: 1200,  suffix: '+', label: 'مزوّد معتمد' },
  { raw: 25,    suffix: '+', label: 'مدينة مغطّاة' },
  { raw: 98,    suffix: '%', label: 'معدّل إتمام الطلبات' },
  { raw: 15000, suffix: '+', label: 'طلب منجز' },
];

const NAV = [
  { href: '#features', label: 'المميزات' },
  { href: '#how',      label: 'كيف نعمل' },
  { href: '#pricing',  label: 'الأسعار' },
  { href: '#contact',  label: 'تواصل' },
];

// ── Animation helpers ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};
const stagger = { show: { transition: { staggerChildren: 0.09 } } };

// ── Sub-components (each has own hooks) ────────────────────────────────────────
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

function StatCard({ raw, suffix, label }: { raw: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const count  = useCounter(raw, inView);
  const display = raw >= 1000
    ? `${(count / 1000).toFixed(count >= raw ? 0 : 1)}K${suffix}`
    : `${count}${suffix}`;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center px-4"
    >
      <div className="text-4xl sm:text-5xl font-extrabold text-primary tabular-nums">{display}</div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc, index }: { icon: React.ElementType; title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.12)' }}
      className="rounded-2xl border bg-card p-6 cursor-default transition-shadow"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: -5 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5"
      >
        <Icon className="h-6 w-6" />
      </motion.div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StepCard({ num, title, desc, index, total }: { num: string; title: string; desc: string; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <div ref={ref} className="relative flex flex-col items-center text-center px-4">
      {/* connecting line */}
      {index < total - 1 && (
        <div className="absolute top-6 start-[calc(50%+32px)] end-[-calc(50%-32px)] h-[2px] hidden lg:block overflow-hidden bg-border">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="h-full w-full origin-right bg-primary/40"
            style={{ transformOrigin: '100% 50%' }}
          />
        </div>
      )}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200, delay: index * 0.12 }}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary text-primary font-extrabold text-2xl mb-5 bg-primary/5 z-10 shrink-0"
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

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={ref} className="py-24 bg-muted/30 border-y">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden" animate={inView ? 'show' : 'hidden'} variants={stagger}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">آراء عملائنا</motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">ثقة بنيناها صفقة بعد أخرى</motion.h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="rounded-2xl border bg-card p-8 shadow-sm"
            >
              <Quote className="h-7 w-7 text-primary/30 mb-4" />
              <p className="text-lg leading-relaxed">&ldquo;{TESTIMONIALS[active].quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3 pt-5 border-t">
                <div className="h-11 w-11 rounded-full bg-primary/15 text-primary grid place-items-center font-semibold text-sm shrink-0">
                  {TESTIMONIALS[active].name.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">{TESTIMONIALS[active].name}</div>
                  <div className="text-sm text-muted-foreground">{TESTIMONIALS[active].role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'w-7 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/40'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const statsRef    = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const howRef      = useRef<HTMLElement>(null);
  const audRef      = useRef<HTMLElement>(null);
  const pricingRef  = useRef<HTMLElement>(null);
  const ctaRef      = useRef<HTMLElement>(null);

  const statsInView    = useInView(statsRef,    { once: true, margin: '-60px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-60px' });
  const howInView      = useInView(howRef,      { once: true, margin: '-60px' });
  const audInView      = useInView(audRef,      { once: true, margin: '-60px' });
  const pricingInView  = useInView(pricingRef,  { once: true, margin: '-60px' });
  const ctaInView      = useInView(ctaRef,      { once: true, margin: '-60px' });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50"
        style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-[1280px] mx-auto h-16 px-4 sm:px-6 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">نِطاق</span>
              <span className="hidden sm:block text-[11px] text-muted-foreground -mt-0.5">منصة الخدمات الذكية</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ms-8">
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
                className="px-4 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                دخول العميل
              </motion.button>
            </Link>
            <Link href={`${CARRIER_URL}/login`}>
              <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 16px rgba(0,201,167,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground">
                دخول مزوّد الخدمة
              </motion.button>
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors ms-1"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="فتح القائمة"
            >
              <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" as const }}
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
                    <button className="w-full py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground">
                      دخول مزوّد الخدمة
                    </button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col items-center justify-center pt-8 pb-16">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(0,201,167,0.13) 0%, transparent 60%), radial-gradient(ellipse 40% 45% at 90% 60%, rgba(13,92,87,0.1) 0%, transparent 55%)',
          }} />
          <motion.div
            animate={{ scale: [1, 1.12, 1], x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-16 start-[8%] h-80 w-80 rounded-full pointer-events-none"
            style={{ background: '#00C9A7', filter: 'blur(80px)', opacity: 0.06 }}
          />
          <motion.div
            animate={{ scale: [1, 1.18, 1], x: [0, -20, 0], y: [0, 18, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
            className="absolute bottom-16 end-[6%] h-[420px] w-[420px] rounded-full pointer-events-none"
            style={{ background: '#0D5C57', filter: 'blur(100px)', opacity: 0.07 }}
          />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.025,
          }} />
        </div>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 w-full">
          <motion.div variants={stagger} initial="hidden" animate="show"
            className="text-center max-w-4xl mx-auto">

            <motion.span variants={fadeUp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-primary/25 bg-primary/8 text-primary mb-6">
              <Zap className="h-3 w-3" />
              منصة الخدمات الذكية في المملكة العربية السعودية
            </motion.span>

            <motion.h1 variants={fadeUp}
              className="text-[44px] sm:text-[62px] md:text-[76px] leading-[1.06] font-extrabold tracking-tight">
              احصل على خدماتك{' '}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #00C9A7 0%, #059669 100%)' }}>
                  بثقة تامة
                </span>
                <motion.span
                  initial={{ scaleX: 0, originX: 1 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" as const }}
                  className="absolute -bottom-1 start-0 end-0 h-[3px] rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00C9A7, transparent)' }}
                />
              </span>
            </motion.h1>

            <motion.p variants={fadeUp}
              className="mt-6 text-base sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              منصة <strong className="text-foreground font-semibold">نِطاق</strong> تربطك بأفضل مقدّمي الخدمات في المملكة —
              أسعار شفافة، متابعة لحظية، ومدفوعات Escrow آمنة تماماً.
            </motion.p>

            <motion.div variants={fadeUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={`${CLIENT_URL}/login`}>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(0,201,167,0.38)' }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #00C9A7 100%)' }}
                >
                  <Package className="h-4 w-4" />
                  ابدأ كعميل — مجاناً
                </motion.button>
              </Link>
              <Link href={`${CARRIER_URL}/login`}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted/60 transition-colors"
                >
                  <Briefcase className="h-4 w-4" />
                  انضم كمقدّم خدمة
                </motion.button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-muted-foreground">
              {[
                { icon: Lock,       text: 'مدفوعات Escrow' },
                { icon: ShieldCheck, text: 'مزوّدون معتمدون' },
                { icon: Clock,       text: 'متابعة لحظية' },
                { icon: TrendingUp,  text: 'دعم ٢٤/٧' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="inline-flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-emerald-500" />
                  <span>{text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Floating dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.75, ease: "easeOut" as const }}
            className="mt-16 relative max-w-2xl mx-auto"
          >
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-2xl"
              style={{ background: 'hsl(var(--card))' }}>
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-muted/30">
                <div className="h-3 w-3 rounded-full bg-red-400/70" />
                <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                <div className="h-3 w-3 rounded-full bg-green-400/70" />
                <span className="ms-3 text-[11px] text-muted-foreground font-mono">dashboard.nitaq.sa</span>
              </div>
              {/* Mock content */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'طلبات نشطة',    val: '٢٤', color: '#00C9A7' },
                    { label: 'طلبات مكتملة', val: '١٢٨', color: '#3B82F6' },
                    { label: 'التوفير',       val: '٢٢٪', color: '#F59E0B' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center"
                      style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}>
                      <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'طلب #١٠٢٤ · صيانة تقنية',   pct: 65, color: '#00C9A7' },
                    { label: 'طلب #١٠٢٣ · تركيب وتجميع', pct: 90, color: '#3B82F6' },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>{r.label}</span>
                        <span>{r.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${r.pct}%` }}
                          transition={{ delay: 0.9, duration: 1.1, ease: "easeOut" as const }}
                          className="h-full rounded-full"
                          style={{ background: r.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -start-6 hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 shadow-xl text-xs font-semibold"
              style={{ background: '#00C9A7', color: '#fff' }}
            >
              <CheckCircle2 className="h-4 w-4" />
              اكتمل التنفيذ · طلب #١٠٢٢
            </motion.div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
              className="absolute -bottom-5 -end-6 hidden sm:flex items-center gap-2 rounded-xl px-3 py-2.5 shadow-xl text-xs font-semibold border border-border"
              style={{ background: 'hsl(var(--background))' }}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              ١٢ مقدّم خدمة يتنافسون الآن
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 start-0 end-0 overflow-hidden leading-[0] pointer-events-none">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-14">
            <path d="M0,32 C240,0 480,56 720,28 C960,0 1200,48 1440,32 L1440,56 L0,56 Z"
              fill="hsl(var(--card))" fillOpacity="0.5" />
          </svg>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="border-y bg-card">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-x-reverse divide-border">
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
              المميزات
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">كل ما تحتاجه لإدارة طلبات الخدمة</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">من تقديم الطلب إلى الإنجاز — كل خطوة محسوبة.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section ref={howRef} id="how" className="py-24 bg-muted/30 border-y">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger} initial="hidden" animate={howInView ? 'show' : 'hidden'}
            className="text-center mb-16 max-w-2xl mx-auto"
          >
            <motion.span variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              كيف نعمل
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">٤ خطوات وخدمتك في الطريق</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">عملية مبسّطة — بدون مكالمات لا نهائية أو مفاجآت.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-4 relative">
            {STEPS.map((s, i) => (
              <StepCard key={s.num} {...s} index={i} total={STEPS.length} />
            ))}
          </div>
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
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">منصة للطرفين</motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client card */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={audInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border bg-card p-8 sm:p-10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-5">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">للعملاء</h3>
              <p className="mt-3 text-base text-muted-foreground">شركات أو أفراد — وفّر وقتك ومالك مع أسعار تنافسية وضمانات قوية.</p>
              <ul className="mt-6 space-y-3">
                {['انشر طلباً في دقائق واحصل على عروض متعددة', 'قارن السعر والتقييم والمدة قبل الاختيار', 'ادفع مرّة واحدة عبر Escrow الآمن', 'تابع تنفيذ طلبك لحظياً وأكّد الإنجاز'].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link href={`${CLIENT_URL}/login`}
                className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold text-primary hover:underline">
                ابدأ كعميل
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </motion.div>

            {/* Provider card */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={audInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl relative overflow-hidden p-8 sm:p-10 text-white"
              style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #0D5C57 55%, #00C9A7 130%)' }}
            >
              <div className="absolute inset-0 opacity-[0.07]" style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white mb-5">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">لمقدّمي الخدمة</h3>
                <p className="mt-3 text-base text-white/80">طلبات خدمة حقيقية يومياً، إدارة كاملة لموظفيك وخدماتك، وتحصيل مضمون أسبوعياً.</p>
                <ul className="mt-6 space-y-3">
                  {['استكشف عشرات الفرص المتاحة في منطقتك', 'قدّم عروضك بسرعة من الجوال أو الويب', 'أدِر موظفيك وخدماتك من لوحة واحدة', 'استلم مدفوعاتك أسبوعياً عبر تحويل بنكي'].map(t => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-white/90">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`${CARRIER_URL}/login`}
                  className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold hover:underline">
                  انضم كمقدّم خدمة
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <TestimonialsSection />

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
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">عمولة بسيطة — لا رسوم خفيّة</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground">عمولة على قيمة الصفقة عند نجاحها فقط. لا اشتراك. لا رسوم تسجيل.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              { title: 'للعميل',  value: 'مجاناً', sub: 'لا تدفع شيئاً للمنصة', featured: false },
              { title: 'للمزوّد', value: '٨٪',     sub: 'من قيمة كل صفقة ناجحة', featured: true },
              { title: 'ضريبة',   value: '١٥٪',    sub: 'على العمولة فقط (VAT)', featured: false },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={p.featured ? { scale: 1.03, boxShadow: '0 0 40px rgba(0,201,167,0.25)' } : { y: -4 }}
                className={`rounded-2xl p-8 text-center transition-shadow ${p.featured ? 'text-white shadow-xl' : 'border bg-card'}`}
                style={p.featured ? { background: 'linear-gradient(135deg, #0A3D3A 0%, #00C9A7 100%)' } : {}}
              >
                <div className={`text-sm font-semibold mb-4 ${p.featured ? 'text-white/80' : 'text-muted-foreground'}`}>{p.title}</div>
                <div className={`text-5xl font-extrabold mb-3 ${p.featured ? 'text-white' : ''}`}>{p.value}</div>
                <div className={`text-sm ${p.featured ? 'text-white/75' : 'text-muted-foreground'}`}>{p.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section ref={ctaRef} id="contact" className="py-20 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden text-white text-center p-12 sm:p-16"
            style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #0D5C57 50%, #00C9A7 100%)' }}
          >
            {/* shimmer overlay */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)' }}
            />
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">جاهز لطلب أول خدمة لك؟</h2>
              <p className="mt-3 text-base text-white/80 max-w-xl mx-auto">سجّل خلال دقيقتين وتلقَّ عروض مقدّمي خدمة معتمدين قبل ما تكمّل قهوتك.</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href={`${CLIENT_URL}/login`}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(255,255,255,0.2)' }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3.5 rounded-xl text-sm font-semibold bg-white text-primary"
                  >
                    ابدأ كعميل
                  </motion.button>
                </Link>
                <Link href={`${CARRIER_URL}/login`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3.5 rounded-xl text-sm font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors"
                  >
                    انضم كمقدّم خدمة
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-card border-t">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-base font-bold">نِطاق</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              منصة الخدمات الذكية في المملكة — نربط الشركات والأفراد بأفضل مقدّمي الخدمات بشفافية كاملة وأسعار تنافسية.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">المنصة</h4>
            <ul className="space-y-2.5 text-sm">
              {[['#features', 'المميزات'], ['#how', 'كيف نعمل'], ['#pricing', 'التسعير']].map(([h, l]) => (
                <li key={l}><a href={h} className="text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">الشركة</h4>
            <ul className="space-y-2.5 text-sm">
              {[['/about', 'عن نِطاق'], ['/contact', 'تواصل'], ['/privacy', 'الخصوصية'], ['/terms', 'الشروط'], ['/transport', 'شروط الخدمة']].map(([h, l]) => (
                <li key={l}><Link href={h} className="text-muted-foreground hover:text-foreground transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} نِطاق · جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}
