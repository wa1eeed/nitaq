'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts';
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, BarChart2, Building2,
  CheckCircle, Clock, Download, Globe, Package, RefreshCw, Shield,
  Star, TrendingUp, Truck, Users, Wallet,
} from 'lucide-react';
import { fetcher } from '@/lib/api';

// ─── Theme tokens ──────────────────────────────────────────────────────────────
const BG     = '#0F172A';
const CARD   = '#1E293B';
const BORDER = '#334155';
const TEXT   = '#F8FAFC';
const MUTED  = '#94A3B8';
const GREEN  = '#00C9A7';
const TEAL   = '#0D5C57';
const GOLD   = '#F59E0B';
const RED    = '#EF4444';
const BLUE   = '#3B82F6';

type Period = '7d' | '30d' | '90d' | '1y';

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d',  label: '7 أيام' },
  { key: '30d', label: '30 يوم' },
  { key: '90d', label: '90 يوم' },
  { key: '1y',  label: 'سنة' },
];

const TABS = [
  { key: 'market',    label: 'السوق',      icon: TrendingUp },
  { key: 'financial', label: 'المالية',     icon: Wallet },
  { key: 'ops',       label: 'التشغيل',     icon: Activity },
  { key: 'growth',    label: 'النمو',       icon: BarChart2 },
  { key: 'investor',  label: 'الملخص الاستراتيجي',  icon: Star },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 0) {
  return (n ?? 0).toLocaleString('en-US', { maximumFractionDigits: decimals });
}
function fmtSAR(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ر.س`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K ر.س`;
  return `${fmt(n)} ر.س`;
}
function fmtPct(n: number) { return `${(n ?? 0).toFixed(1)}%`; }
function delta(n: number) {
  if (n > 0) return { color: GREEN, icon: <ArrowUp className="h-3 w-3" />,   text: `+${fmtPct(n)}` };
  if (n < 0) return { color: RED,   icon: <ArrowDown className="h-3 w-3" />, text: fmtPct(n) };
  return { color: MUTED, icon: null, text: '0%' };
}
function trafficLight(val: number, good: number, ok: number) {
  if (val >= good) return GREEN;
  if (val >= ok)   return GOLD;
  return RED;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 1.4, repeat: Infinity }}
      className={`${w} ${h} rounded-md`}
      style={{ background: BORDER }}
    />
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, change, icon: Icon, accent = GREEN, sparkData,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number;
  icon?: React.ElementType;
  accent?: string;
  sparkData?: number[];
}) {
  const d = change !== undefined ? delta(change) : null;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center justify-between">
        <span style={{ color: MUTED, fontSize: 12 }}>{label}</span>
        {Icon && (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
        )}
      </div>
      <div style={{ color: TEXT, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div className="flex items-center justify-between">
        {sub && <span style={{ color: MUTED, fontSize: 11 }}>{sub}</span>}
        {d && (
          <div className="flex items-center gap-1" style={{ color: d.color, fontSize: 12 }}>
            {d.icon}{d.text}
          </div>
        )}
      </div>
      {sparkData && sparkData.length > 0 && (
        <div style={{ height: 32, marginTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData.map((v, i) => ({ i, v }))}>
              <Line type="monotone" dataKey="v" stroke={accent} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-4 w-1 rounded-full" style={{ background: GREEN }} />
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{children}</h3>
    </div>
  );
}

// ─── Chart wrapper ────────────────────────────────────────────────────────────
function ChartCard({
  title, children, span = 1,
}: {
  title: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${span === 2 ? 'col-span-2' : ''}`}
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
    >
      <div style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

const CHART_COLORS = [GREEN, TEAL, GOLD, BLUE, '#8B5CF6', '#EC4899'];

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportPDF(summary: Record<string, unknown> | undefined, period: string) {
  const { default: jsPDF } = await import('jspdf');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autoTableModule = await import('jspdf-autotable') as any;
  const autoTable = autoTableModule.default ?? autoTableModule;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString('ar-SA');

  const addHeader = (page: number, total: number) => {
    doc.setFillColor(10, 61, 58);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('نقلة لوجيستك — سري للاستخدام الداخلي', pageW - 10, 12, { align: 'right' });
    doc.text(`صفحة ${page} من ${total}`, 10, 12);
  };
  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`تاريخ الإصدار: ${today}`, pageW / 2, pageH - 8, { align: 'center' });
  };

  // ── Page 1: Cover ──
  doc.setFillColor(10, 61, 58);
  doc.rect(0, 0, pageW, pageH, 'F');
  doc.setFillColor(0, 201, 167);
  doc.rect(0, pageH / 2 - 2, pageW, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text('نقلة لوجيستك', pageW / 2, 80, { align: 'center' });
  doc.setFontSize(18);
  doc.text('التقرير التنفيذي للأداء', pageW / 2, 100, { align: 'center' });
  doc.setFontSize(13);
  const pLabel: Record<string, string> = { '7d': '7 أيام', '30d': '30 يوم', '90d': '90 يوم', '1y': 'سنة' };
  doc.text(`الفترة: آخر ${pLabel[period] ?? period}`, pageW / 2, 120, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`تاريخ الإصدار: ${today}`, pageW / 2, 140, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(0, 201, 167);
  doc.text('سري — للاستخدام الداخلي فقط', pageW / 2, 160, { align: 'center' });

  // ── Page 2: Executive Summary ──
  doc.addPage();
  addHeader(2, 4);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.text('الملخص التنفيذي', pageW - 20, 35, { align: 'right' });

  const gmv            = Number(summary?.gmv ?? 0);
  const revenue        = Number(summary?.revenue ?? 0);
  const completionRate = Number(summary?.completionRate ?? 0);
  const onTimeRate     = Number(summary?.onTimeDeliveryRate ?? 0);
  const disputeRate    = Number(summary?.disputeRate ?? 0);
  const newClients     = Number(summary?.newClients ?? 0);
  const newProviders   = Number(summary?.newCarriers ?? 0);
  const gmvMoM         = Number(summary?.gmvMoM ?? 0);
  const takeRate       = Number(summary?.takeRate ?? 0);

  autoTable(doc, {
    startY: 45,
    head: [['المؤشر', 'القيمة', 'التقييم']],
    body: [
      ['GMV (إجمالي المعاملات)', fmtSAR(gmv), gmvMoM > 0 ? '↑ نمو' : '—'],
      ['الإيراد (العمولات)', fmtSAR(revenue), ''],
      ['معدل الإكمال', fmtPct(completionRate), completionRate >= 90 ? '✓ ممتاز' : '⚠ تحسين مطلوب'],
      ['التسليم في الوقت', fmtPct(onTimeRate), onTimeRate >= 95 ? '✓' : '⚠'],
      ['معدل النزاعات', fmtPct(disputeRate), disputeRate <= 2 ? '✓' : '⚠'],
      ['عملاء جدد', fmt(newClients), ''],
      ['ناقلون جدد', fmt(newProviders), ''],
    ],
    styles: { font: 'helvetica', fontSize: 10, halign: 'right' },
    headStyles: { fillColor: [10, 61, 58], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 250, 248] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summaryY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  const summaryText = gmvMoM > 0
    ? `حققت المنصة نمواً بنسبة ${gmvMoM.toFixed(1)}% في GMV مقارنة بالفترة السابقة. معدل الإكمال ${fmtPct(completionRate)} ومعدل التسليم في الوقت ${fmtPct(onTimeRate)}.`
    : `أداء المنصة مستقر خلال الفترة. GMV: ${fmtSAR(gmv)}. معدل الإكمال: ${fmtPct(completionRate)}.`;
  doc.text(summaryText, pageW - 20, summaryY, { align: 'right', maxWidth: pageW - 30 });
  addFooter();

  // ── Page 3: Market KPIs ──
  doc.addPage();
  addHeader(3, 4);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.text('مؤشرات السوق', pageW - 20, 35, { align: 'right' });

  const topRoutes  = Array.isArray(summary?.topRoutes)  ? (summary.topRoutes as Array<{ route: string }>)  : [];
  const topProviders = Array.isArray(summary?.topCarriers) ? (summary.topCarriers as Array<{ name: string }>) : [];

  autoTable(doc, {
    startY: 45,
    head: [['المؤشر', 'الفعلي', 'الهدف', 'الحالة']],
    body: [
      ['Take Rate', fmtPct(takeRate), '8%', Math.abs(takeRate - 8) <= 1 ? '✓' : '⚠'],
      ['أعلى مسار', topRoutes[0]?.route ?? '—', '—', ''],
      ['أعلى ناقل', topProviders[0]?.name ?? '—', '—', ''],
    ],
    styles: { halign: 'right', fontSize: 10 },
    headStyles: { fillColor: [10, 61, 58], textColor: [255, 255, 255] },
  });
  addFooter();

  // ── Page 4: Growth & Investor ──
  doc.addPage();
  addHeader(4, 4);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.text('النمو والمستثمرون', pageW - 20, 35, { align: 'right' });
  autoTable(doc, {
    startY: 45,
    head: [['المؤشر', 'القيمة']],
    body: [
      ['نمو الطلبات MoM', fmtPct(Number(summary?.ordersMoM ?? 0))],
      ['نمو GMV MoM',     fmtPct(gmvMoM)],
      ['عملاء جدد',       fmt(newClients)],
      ['ناقلون جدد',      fmt(newProviders)],
    ],
    styles: { halign: 'right', fontSize: 10 },
    headStyles: { fillColor: [13, 92, 87], textColor: [255, 255, 255] },
  });
  addFooter();

  doc.save(`naqla-report-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Tab components ───────────────────────────────────────────────────────────

function MarketTab({ period }: { period: Period }) {
  const { data, isLoading } = useSWR(`/admin/analytics/marketplace?period=${period}`, fetcher, { refreshInterval: 300_000 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;

  const statusData = useMemo(() => {
    if (!d?.ordersByStatus) return [];
    const labels: Record<string, string> = {
      COMPLETED: 'مكتملة', IN_TRANSIT: 'في الطريق', BIDDING: 'قيد العروض',
      PUBLISHED: 'منشورة', ASSIGNED: 'مُسندة', CONFIRMED: 'مؤكدة',
      CANCELLED: 'ملغاة', DRAFT: 'مسودة', DELIVERED: 'مُسلَّمة',
    };
    return Object.entries(d.ordersByStatus as Record<string, number>).map(([k, v]) => ({
      name: labels[k] ?? k,
      value: v,
    }));
  }, [d]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <Skel key={i} h="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="GMV" value={fmtSAR(d?.gmv)} icon={Wallet} accent={GREEN} sparkData={(d?.gmvTrend ?? []).map((t: { value: number }) => t.value)} />
        <KpiCard label="Take Rate" value={fmtPct(d?.takeRate)} sub="عمولة من GMV" icon={TrendingUp} accent={TEAL} />
        <KpiCard label="معدل الإكمال" value={fmtPct(d?.completionRate)} icon={CheckCircle} accent={trafficLight(d?.completionRate ?? 0, 90, 75)} />
        <KpiCard label="متوسط وقت المطابقة" value={`${(d?.avgMatchingHours ?? 0).toFixed(1)} ساعة`} icon={Clock} accent={GOLD} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="استخدام الناقلين" value={fmtPct(d?.carrierUtilization)} icon={Truck} accent={BLUE} />
        <KpiCard label="سيولة العروض" value={`${(d?.supplyLiquidity ?? 0).toFixed(1)} عرض/طلب`} icon={Activity} accent={GREEN} />
        <KpiCard label="معدل التكرار" value={fmtPct(d?.repeatRate)} sub="عملاء بطلب ثانٍ" icon={RefreshCw} accent={TEAL} />
        <KpiCard label="العمولات" value={fmtSAR(d?.commission)} icon={Wallet} accent={GOLD} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="توزيع الطلبات حسب الحالة">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                label={({ name, percent }: PieLabelRenderProps) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusData.map((_: unknown, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="أكثر المسارات طلباً">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(d?.topRoutes ?? []).slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} />
              <YAxis type="category" dataKey="route" width={120} tick={{ fill: MUTED, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
              <Bar dataKey="count" fill={GREEN} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3" style={{ background: CARD }}>
          <span style={{ color: MUTED, fontSize: 12 }}>أعلى الناقلين إيراداً</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: CARD }}>
              {['#', 'الناقل', 'الطلبات', 'الإيراد'].map((h) => (
                <th key={h} className="px-5 py-3 text-right" style={{ color: MUTED, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(d?.topCarriers ?? []).map((c: { carrierId: string; name: string; count: number; revenue: number }, i: number) => (
              <tr
                key={c.carrierId}
                style={{ borderBottom: `1px solid ${BORDER}20`, background: i % 2 ? `${CARD}80` : 'transparent' }}
              >
                <td className="px-5 py-3" style={{ color: MUTED }}>{i + 1}</td>
                <td className="px-5 py-3 font-medium" style={{ color: TEXT }}>{c.name}</td>
                <td className="px-5 py-3" style={{ color: MUTED }}>{fmt(c.count)}</td>
                <td className="px-5 py-3 font-semibold" style={{ color: GREEN }}>{fmtSAR(c.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinancialTab({ period }: { period: Period }) {
  const { data, isLoading } = useSWR(`/admin/analytics/financial?period=${period}`, fetcher, { refreshInterval: 300_000 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => <Skel key={i} h="h-32" />)}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="GMV" value={fmtSAR(d?.gmv)} change={d?.gmvGrowth} icon={Wallet} accent={GREEN} sparkData={(d?.gmvTrend ?? []).map((t: { value: number }) => t.value)} />
        <KpiCard label="الإيراد (عمولات)" value={fmtSAR(d?.revenue)} change={d?.revenueGrowth} icon={TrendingUp} accent={TEAL} sparkData={(d?.revTrend ?? []).map((t: { value: number }) => t.value)} />
        <KpiCard label="Take Rate" value={fmtPct(d?.takeRate)} sub="الهدف: 8%" icon={Activity} accent={GOLD} />
        <KpiCard label="متوسط قيمة الطلب" value={fmtSAR(d?.avgOrderValue)} icon={Package} accent={BLUE} />
        <KpiCard label="ضريبة القيمة المضافة" value={fmtSAR(d?.vat)} sub="15% من الإيراد" icon={Building2} accent={MUTED} />
        <KpiCard label="نمو GMV MoM" value={fmtPct(d?.gmvGrowth)} change={d?.gmvGrowth} icon={TrendingUp} accent={(d?.gmvGrowth ?? 0) >= 0 ? GREEN : RED} />
      </div>
      <ChartCard title="GMV مقابل الإيراد — اتجاه زمني" span={2}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={(d?.gmvTrend ?? []).map((t: { label: string; value: number }, i: number) => ({
              ...t,
              revenue: (d?.revTrend ?? [])[i]?.value ?? 0,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fill: MUTED, fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}
              formatter={(v: unknown) => fmtSAR(Number(v))}
            />
            <Legend wrapperStyle={{ color: MUTED }} />
            <Line type="monotone" dataKey="value"   name="GMV"     stroke={GREEN} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="revenue" name="الإيراد" stroke={GOLD}  strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function OpsTab({ period }: { period: Period }) {
  const { data, isLoading } = useSWR(`/admin/analytics/operational?period=${period}`, fetcher, { refreshInterval: 300_000 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => <Skel key={i} h="h-32" />)}
      </div>
    );
  }
  const onTimeColor = trafficLight(d?.onTimeDeliveryRate ?? 0, 95, 85);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="التسليم في الوقت" value={fmtPct(d?.onTimeDeliveryRate)} sub="الهدف: >95%" icon={CheckCircle} accent={onTimeColor} />
        <KpiCard label="معدل النزاعات" value={fmtPct(d?.disputeRate)} sub="الهدف: <2%" icon={AlertTriangle} accent={trafficLight(100 - (d?.disputeRate ?? 100), 98, 90)} />
        <KpiCard label="توفر الأسطول" value={fmtPct(d?.fleetAvailability)} icon={Truck} accent={BLUE} />
        <KpiCard label="متوسط وقت التوصيل" value={`${(d?.avgDeliveryDays ?? 0).toFixed(1)} يوم`} icon={Clock} accent={TEAL} />
        <KpiCard label="معدل اعتماد KYC" value={fmtPct(d?.kycApprovalRate)} icon={Shield} accent={GREEN} />
        <KpiCard label="نزاعات مفتوحة" value={fmt(d?.openDisputes)} icon={AlertTriangle} accent={(d?.openDisputes ?? 0) > 5 ? RED : GOLD} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'التسليم في الوقت', val: d?.onTimeDeliveryRate, good: 95, ok: 85 },
          { label: 'معدل النزاعات',    val: 100 - (d?.disputeRate ?? 0), good: 98, ok: 95 },
          { label: 'توفر الأسطول',     val: d?.fleetAvailability, good: 70, ok: 50 },
        ].map(({ label, val, good, ok }) => {
          const color = trafficLight(val ?? 0, good, ok);
          return (
            <div
              key={label}
              className="rounded-2xl p-5 flex flex-col items-center gap-3"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <span style={{ color: MUTED, fontSize: 12 }}>{label}</span>
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ background: `${color}20`, border: `3px solid ${color}` }}
              >
                <span style={{ color, fontSize: 18, fontWeight: 700 }}>{fmtPct(val ?? 0)}</span>
              </div>
              <span style={{ color, fontSize: 11 }}>
                {color === GREEN ? '🟢 ممتاز' : color === GOLD ? '🟡 مقبول' : '🔴 تحسين مطلوب'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GrowthTab({ period }: { period: Period }) {
  const { data, isLoading } = useSWR(`/admin/analytics/growth?period=${period}`, fetcher, { refreshInterval: 300_000 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => <Skel key={i} h="h-32" />)}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="نمو الطلبات MoM" value={fmtPct(d?.ordersMoM)} change={d?.ordersMoM} icon={Package} accent={(d?.ordersMoM ?? 0) >= 0 ? GREEN : RED} />
        <KpiCard label="نمو GMV MoM" value={fmtPct(d?.gmvMoM)} change={d?.gmvMoM} icon={Wallet} accent={(d?.gmvMoM ?? 0) >= 0 ? GREEN : RED} />
        <KpiCard label="عملاء جدد" value={fmt(d?.newClients)} sub={`vs ${fmt(d?.prevClients)} الفترة السابقة`} change={d?.clientsMoM} icon={Users} accent={GREEN} />
        <KpiCard label="ناقلون جدد" value={fmt(d?.newCarriers)} change={d?.carriersMoM} icon={Truck} accent={TEAL} />
        <KpiCard label="التغطية الجغرافية" value={`${fmt(d?.geographicCoverage)} مدينة`} icon={Globe} accent={BLUE} />
        <KpiCard label="إجمالي الطلبات" value={fmt(d?.ordersNow)} sub={`vs ${fmt(d?.ordersPrev)}`} icon={Package} accent={GOLD} />
      </div>
      <ChartCard title="مقارنة النمو — الفترة الحالية vs السابقة">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { name: 'الطلبات',        current: d?.ordersNow   ?? 0, prev: d?.ordersPrev   ?? 0 },
            { name: 'العملاء الجدد',  current: d?.newClients  ?? 0, prev: d?.prevClients  ?? 0 },
            { name: 'الناقلون الجدد', current: d?.newCarriers ?? 0, prev: d?.prevCarriers ?? 0 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} />
            <YAxis tick={{ fill: MUTED, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
            <Legend wrapperStyle={{ color: MUTED }} />
            <Bar dataKey="current" name="الفترة الحالية"  fill={GREEN}  radius={[4, 4, 0, 0]} />
            <Bar dataKey="prev"    name="الفترة السابقة" fill={BORDER} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function InvestorTab({ period, summary }: { period: Period; summary: Record<string, unknown> | undefined }) {
  const { data, isLoading } = useSWR(`/admin/analytics/investor?period=${period}`, fetcher, { refreshInterval: 300_000 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => <Skel key={i} h="h-32" />)}
      </div>
    );
  }

  const summaryText = useMemo(() => {
    if (!summary) return '—';
    const growth    = Number(summary.gmvMoM ?? 0);
    const cr        = Number(summary.completionRate ?? 0);
    const ot        = Number(summary.onTimeDeliveryRate ?? 0);
    const gmv       = Number(summary.gmv ?? 0);
    const clients   = Number(summary.newClients ?? 0);
    const providers = Number(summary.newCarriers ?? 0);
    return growth > 0
      ? `حققت المنصة نمواً بنسبة ${growth.toFixed(1)}% في GMV مقارنة بالفترة السابقة. معدل الإكمال ${cr.toFixed(1)}% ومعدل التسليم في الوقت ${ot.toFixed(1)}%. تم استقطاب ${clients} عميل و${providers} ناقل جديد خلال الفترة.`
      : `أداء المنصة مستقر خلال الفترة. GMV: ${fmtSAR(gmv)}. معدل إكمال الطلبات: ${cr.toFixed(1)}%. ${clients} عميل جديد.`;
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="LTV (متوسط قيمة العميل)" value={fmtSAR(d?.ltv)} icon={Star} accent={GOLD} />
        <KpiCard label="Cohort Retention" value={fmtPct(d?.cohortRetention)} sub="عملاء عادوا الفترة التالية" icon={RefreshCw} accent={GREEN} />
        <KpiCard label="Network Effect Score" value={(d?.networkEffectScore ?? 0).toFixed(2)} sub="نسبة نمو الطلبات/الناقلين" icon={Activity} accent={BLUE} />
        <KpiCard label="اختراق السوق" value={fmtPct(d?.marketPenetration)} sub="مدن نشطة من 20" icon={Globe} accent={TEAL} />
        <KpiCard label="عملاء نشطون" value={fmt(d?.activeClientsCount)} icon={Users} accent={GREEN} />
        <KpiCard label="Unit Economics" value={(d?.ltv ?? 0) > 0 ? `LTV: ${fmtSAR(d?.ltv)}` : '—'} sub="CAC: 0 (تقدير)" icon={TrendingUp} accent={GOLD} />
      </div>
      <div className="rounded-2xl p-6" style={{ background: `${TEAL}20`, border: `1px solid ${TEAL}40` }}>
        <SectionTitle>الملخص التنفيذي التلقائي</SectionTitle>
        <p style={{ color: TEXT, lineHeight: 1.8, fontSize: 14 }}>{summaryText}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [period, setPeriod]       = useState<Period>('30d');
  const [activeTab, setActiveTab] = useState('market');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [exporting, setExporting] = useState(false);

  const { data: summary } = useSWR(
    `/admin/analytics/summary?period=${period}`,
    fetcher<Record<string, unknown>>,
    { refreshInterval: 300_000 },
  );

  useEffect(() => {
    const t = setInterval(() => setLastRefresh(new Date()), 300_000);
    return () => clearInterval(t);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try { await exportPDF(summary, period); }
    finally { setExporting(false); }
  }, [summary, period]);

  return (
    <div className="min-h-screen -m-4 lg:-m-6 p-4 lg:p-6" style={{ background: BG }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 700 }}>لوحة المؤشرات التنفيذية</h1>
          <p style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
            آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA')} · يتجدد كل 5 دقائق
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selector */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: period === p.key ? GREEN : 'transparent',
                  color:      period === p.key ? '#000' : MUTED,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: TEAL, color: '#fff' }}
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'جارٍ التصدير...' : 'تصدير PDF'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 flex-wrap"
        style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 0 }}
      >
        {TABS.map((tab) => {
          const Icon     = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ color: isActive ? GREEN : MUTED }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: GREEN }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${period}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'market'    && <MarketTab period={period} />}
          {activeTab === 'financial' && <FinancialTab period={period} />}
          {activeTab === 'ops'       && <OpsTab period={period} />}
          {activeTab === 'growth'    && <GrowthTab period={period} />}
          {activeTab === 'investor'  && <InvestorTab period={period} summary={summary} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
