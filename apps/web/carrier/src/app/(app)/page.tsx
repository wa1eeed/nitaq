'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BarChart2, Clock, Compass, FileText, Package,
  Star, TrendingUp, Truck, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import { fetcher } from '@/lib/api';
import {
  CURRENT_CARRIER_ID, DRIVERS, TRUCKS, companyById, formatDate, formatRelative,
  openOpportunitiesForCarrier, ordersForCarrier, paymentsForCarrier,
  normalizeOrderList, type Order,
} from '@naqla/shared-utils';

const STATUS_EVENT: Record<string, { label: string; color: string }> = {
  ASSIGNED:   { label: 'تم تعيينك على طلب',      color: 'bg-success/10 text-success' },
  CONFIRMED:  { label: 'تم تأكيد الطلب',          color: 'bg-primary/10 text-primary' },
  IN_TRANSIT: { label: 'طلب قيد التوصيل',         color: 'bg-warning/10 text-warning' },
  COMPLETED:  { label: 'تم إتمام الطلب',          color: 'bg-success/10 text-success' },
  DELIVERED:  { label: 'تم التسليم والاستلام',    color: 'bg-success/10 text-success' },
};

const QUICK_ACTIONS = [
  { label: 'استكشف الفرص',  href: '/opportunities',    Icon: Compass,   color: 'bg-primary/10 text-primary' },
  { label: 'أسطولي',         href: '/fleet/trucks',     Icon: Truck,     color: 'bg-success/10 text-success' },
  { label: 'المستندات',      href: '/documents',        Icon: FileText,  color: 'bg-warning/10 text-warning' },
  { label: 'التقارير',       href: '/reports',          Icon: BarChart2, color: 'bg-muted text-muted-foreground' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function CarrierDashboard() {
  const me = companyById(CURRENT_CARRIER_ID)!;

  const { data: oppsData }   = useSWR<unknown>('/orders', fetcher);
  const { data: mineData }   = useSWR<unknown>('/orders?mine=true', fetcher);
  const { data: trucksData } = useSWR<unknown>('/fleet/trucks', fetcher);
  const { data: paysData }   = useSWR<unknown>('/payments', fetcher);

  const opps: Order[] = useMemo(() => {
    const arr = normalizeOrderList(oppsData);
    return arr.length > 0 ? arr : openOpportunitiesForCarrier(CURRENT_CARRIER_ID);
  }, [oppsData]);
  const myOrders: Order[] = useMemo(() => {
    const arr = normalizeOrderList(mineData);
    return arr.length > 0 ? arr : ordersForCarrier(CURRENT_CARRIER_ID);
  }, [mineData]);
  const activeOrders = myOrders.filter((o) => ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(o.status));

  const trucks = useMemo(() => {
    const arr =
      Array.isArray(trucksData) ? trucksData :
      Array.isArray((trucksData as { items?: unknown[] })?.items) ? (trucksData as { items: unknown[] }).items :
      [];
    return arr.length > 0 ? arr as typeof TRUCKS : TRUCKS;
  }, [trucksData]);
  const available = trucks.filter((t) => t.status === 'AVAILABLE').length;

  const payments = useMemo(() => {
    const arr =
      Array.isArray(paysData) ? paysData :
      Array.isArray((paysData as { items?: unknown[] })?.items) ? (paysData as { items: unknown[] }).items :
      [];
    return arr.length > 0 ? arr as ReturnType<typeof paymentsForCarrier> : paymentsForCarrier(CURRENT_CARRIER_ID);
  }, [paysData]);
  const monthlyNet = payments
    .filter((p) => p.state === 'RELEASED')
    .reduce((s, p) => s + (p.amount - p.commission - p.vat), 0);

  const feedEvents = useMemo(() => {
    return myOrders
      .slice(0, 6)
      .filter((o) => STATUS_EVENT[o.status])
      .map((o) => ({
        id:    o.id,
        href:  `/orders/${o.id}`,
        label: STATUS_EVENT[o.status].label,
        color: STATUS_EVENT[o.status].color,
        sub:   `${o.orderNumber} · ${o.originCity} ← ${o.destinationCity}`,
        time:  formatRelative(o.createdAt),
      }));
  }, [myOrders]);

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">

      {/* ── Hero ── */}
      <motion.div variants={item}>
        <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #0A3D3A 0%, #0D5C57 60%, #00C9A7 100%)' }}>
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-6 left-20 h-28 w-28 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col gap-1 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">مرحباً بعودتك 👋</h1>
              <p className="mt-1 text-sm text-white/70">
                {opps.length} فرصة متاحة &middot; {activeOrders.length} طلب نشط
              </p>
            </div>
            <Link href="/opportunities">
              <Button className="mt-4 sm:mt-0 bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm shadow-none">
                <Compass className="h-4 w-4" />
                استكشف الفرص
              </Button>
            </Link>
          </div>

          <svg viewBox="0 0 1200 56" className="absolute bottom-0 left-0 right-0 w-full" preserveAspectRatio="none">
            <path d="M0,35 C300,5 900,65 1200,25 L1200,56 L0,56 Z" fill="rgba(255,255,255,0.06)" />
            <path d="M0,45 C400,18 800,60 1200,38 L1200,56 L0,56 Z" fill="rgba(255,255,255,0.04)" />
          </svg>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard label="فرص متاحة"      value={opps.length}        hint="مفتوحة + موجّهة لشركتك"  icon={Compass} tone="default" />
        <StatsCard label="طلباتي النشطة"  value={activeOrders.length} hint="قيد التنفيذ"             icon={Package} tone="warning" />
        <StatsCard label="شاحنات متاحة"   value={`${available}/${trucks.length}`} hint={`${DRIVERS.length} سائق`} icon={Truck} tone="default" />
        <StatsCard label="أرباح الشهر"    value={<Currency amount={monthlyNet} />} hint="صافي بعد العمولة" icon={Wallet} tone="success" />
      </motion.div>

      {/* ── KPI band ── */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-5 divide-y sm:divide-y-0 sm:divide-x rtl:divide-x-reverse">
            <Kpi icon={Star}       label="تقييم الشركة"       value={`${me.rating?.toFixed(1)} ⭐`}                          hint={`${(me.completedTrips ?? 0).toLocaleString('en-US')} رحلة`} />
            <Kpi icon={TrendingUp} label="رحلات منجزة"        value={(me.completedTrips ?? 0).toLocaleString('en-US')}       hint="على المنصة" />
            <Kpi icon={Clock}      label="متوسّط الاستجابة"   value={`${me.responseTimeMins} دقيقة`}                         hint="من نشر الطلب" />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div variants={item}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">إجراءات سريعة</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ label, href, Icon, color }) => (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-2.5 rounded-2xl border bg-card p-5 cursor-pointer transition-colors hover:border-border/80"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-center">{label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Tables + Activity Feed ── */}
      <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Opportunities table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>فرص نقل جديدة</CardTitle>
                <CardDescription className="mt-1">{opps.length} فرصة متاحة الآن</CardDescription>
              </div>
              <Link href="/opportunities">
                <Button variant="ghost" size="sm" className="gap-1">
                  الكل
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المسار</TableHead>
                  <TableHead>الاستلام</TableHead>
                  <TableHead className="text-end">الوزن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opps.slice(0, 5).map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => (window.location.href = `/opportunities/${o.id}`)}>
                    <TableCell>
                      <div>
                        <div className="text-sm">{o.originCity} ← {o.destinationCity}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{o.cargoDescription}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(o.pickupDate)}</TableCell>
                    <TableCell className="text-end num text-sm">{o.weightKg.toLocaleString('en-US')} كجم</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* My Orders table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>طلباتي الجارية</CardTitle>
                <CardDescription className="mt-1">{myOrders.length} طلب</CardDescription>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="gap-1">
                  الكل
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم</TableHead>
                  <TableHead>المسار</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-end">الأجرة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myOrders.slice(0, 5).map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => (window.location.href = `/orders/${o.id}`)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{o.orderNumber}</TableCell>
                    <TableCell>{o.originCity} ← {o.destinationCity}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-end"><Currency amount={o.carrierAmount ?? o.agreedPrice} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Activity Feed timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">آخر الأنشطة</CardTitle>
            <CardDescription>تحديثات طلباتك الأخيرة</CardDescription>
          </CardHeader>
          <CardContent>
            {feedEvents.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Package className="h-8 w-8 text-muted-foreground/40" />
                لا توجد أنشطة حديثة
              </div>
            ) : (
              <div className="relative space-y-1">
                <div className="absolute start-[14px] top-2 bottom-2 w-px bg-border" />
                {feedEvents.map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link href={ev.href}>
                      <div className="flex gap-3 rounded-lg px-1 py-2 hover:bg-muted/40 transition-colors cursor-pointer">
                        <div className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ev.color}`}>
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">{ev.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{ev.sub}</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{ev.time}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </motion.div>

    </motion.div>
  );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 py-3 first:ps-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold num mt-0.5">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}
