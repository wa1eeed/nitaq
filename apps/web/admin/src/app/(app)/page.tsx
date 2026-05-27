'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Building2, FileText, Wallet, AlertTriangle, ArrowLeft,
  Coins, Loader2, RefreshCw, Inbox, Briefcase,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import { fetcher } from '@/lib/api';
import { ORDERS, COMPANIES, DISPUTES, PAYMENTS, companyById, formatRelative } from '@naqla/shared-utils';

interface DashboardStats {
  totalOrders?: number;
  gmv?: number;
  commission?: number;
  activeCompanies?: number;
  pendingKyc?: number;
  openDisputes?: number;
  activeDrivers?: number;
  orders?: { today?: number; week?: number; month?: number };
  revenue?: { gmv?: number; commission?: number };
}

export default function AdminDashboard() {
  // SWR pulls real stats from `/admin/dashboard/stats`. When the endpoint
  // returns nothing useful (or API is unreachable + mock fallback engages),
  // we compute stats from the mock arrays so the dashboard never looks empty.
  const { data: statsData, isLoading } = useSWR<DashboardStats>('/admin/dashboard/stats', fetcher);
  // Recent orders for the table — same pattern, falls back to ORDERS array.
  const { data: ordersData } = useSWR<unknown>('/admin/orders', fetcher);
  const recentOrders = useMemo(() => {
    const arr =
      Array.isArray(ordersData) ? ordersData :
      Array.isArray((ordersData as { items?: unknown[] })?.items) ? (ordersData as { items: unknown[] }).items :
      [];
    if (arr.length > 0) return arr as typeof ORDERS;
    return ORDERS;
  }, [ordersData]);

  const stats = useMemo(() => {
    const fallbackGmv        = PAYMENTS.reduce((s, p) => s + p.amount, 0);
    const fallbackCommission = PAYMENTS.reduce((s, p) => s + p.commission, 0);
    // API returns { orders: { today, week, month }, revenue: { gmv, commission }, ... }
    // but also accept flat shape for backward compat.
    const apiGmv         = statsData?.revenue?.gmv         ?? statsData?.gmv;
    const apiCommission  = statsData?.revenue?.commission   ?? statsData?.commission;
    const apiOrders      = statsData?.orders?.month         ?? statsData?.totalOrders;
    return {
      totalOrders:      apiOrders           ?? ORDERS.length,
      gmv:              apiGmv              ?? fallbackGmv,
      commission:       apiCommission       ?? fallbackCommission,
      activeCompanies:  statsData?.activeCompanies ?? COMPANIES.filter((c) => c.kycStatus === 'APPROVED').length,
      pendingKyc:       statsData?.pendingKyc      ?? COMPANIES.filter((c) => c.kycStatus === 'PENDING_VERIFICATION').length,
      openDisputes:     statsData?.openDisputes    ?? DISPUTES.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length,
      activeDrivers:    statsData?.activeDrivers   ?? 0,
    };
  }, [statsData]);

  const { totalOrders, gmv, commission, activeCompanies, pendingKyc, openDisputes, activeDrivers } = stats;
  void isLoading; // future: skeleton state on first load

  return (
    <>
      <PageHeader
        title="لوحة التحكم 👋"
        subtitle="نظرة شاملة على نشاط منصة نِطاق"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatsCard
          label="طلبات هذا الشهر"
          value={totalOrders}
          hint="الإجمالي المسجَّل"
          icon={FileText}
          tone="default"
        />
        <StatsCard
          label="إجمالي المعاملات"
          value={<Currency amount={gmv} />}
          hint={`عمولة محقّقة: ${commission.toLocaleString('en-US')} ر.س.`}
          icon={Wallet}
          tone="success"
        />
        <StatsCard
          label="مزودون نشيطون"
          value={activeCompanies}
          hint={`${pendingKyc} بانتظار KYC`}
          icon={Building2}
          tone="default"
        />
        <StatsCard
          label="نزاعات مفتوحة"
          value={openDisputes}
          hint="تحتاج مراجعة"
          icon={AlertTriangle}
          tone="danger"
        />
        <StatsCard
          label="مزودون نشيطون الآن"
          value={activeDrivers}
          hint="قيد التنفيذ"
          icon={Briefcase}
          tone="warning"
        />
      </div>

      {/* Activity grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Latest orders */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>آخر الطلبات</CardTitle>
                <CardDescription className="mt-1">آخر 7 طلبات على المنصة</CardDescription>
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
                  <TableHead>العميل</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-end">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.slice(0, 7).map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => (window.location.href = `/orders/${o.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{o.orderNumber}</TableCell>
                    <TableCell>{companyById(o.clientId)?.nameAr ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{o.originCity}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-end"><Currency amount={o.agreedPrice ?? o.clientBudget} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Urgent tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مهام عاجلة</CardTitle>
            <CardDescription>تحتاج مراجعة فورية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DISPUTES.filter((d) => d.status === 'OPEN').slice(0, 1).map((d) => (
              <UrgentRow
                key={d.id}
                priority="high"
                icon={AlertTriangle}
                title={`نزاع · ${d.reason}`}
                meta={`${d.id} · ${formatRelative(d.createdAt)}`}
              />
            ))}
            {COMPANIES.filter((c) => c.kycStatus === 'PENDING_VERIFICATION').slice(0, 1).map((c) => (
              <UrgentRow
                key={c.id}
                priority="medium"
                icon={Inbox}
                title="KYC بانتظار المراجعة"
                meta={c.nameAr}
              />
            ))}
            {PAYMENTS.filter((p) => p.state === 'HELD').slice(0, 1).map((p) => (
              <UrgentRow
                key={p.id}
                priority="low"
                icon={Coins}
                title="إفراج Escrow جاهز"
                meta={`${p.id} · ${p.amount.toLocaleString('en-US')} ر.س.`}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر نشاط</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ActivityItem icon={FileText} tone="default" title="طلب جديد منشور" meta={`${ORDERS[3]?.orderNumber} · منذ ساعتين`} />
          <ActivityItem icon={Coins} tone="success" title="إفراج عن مبلغ Escrow" meta={`${PAYMENTS[0]?.amount.toLocaleString('en-US')} ر.س. · أمس`} />
          <ActivityItem icon={RefreshCw} tone="warning" title="طلب بانتظار قبول العرض" meta="منذ 3 ساعات" />
        </CardContent>
      </Card>
    </>
  );
}

function UrgentRow({
  priority, icon: Icon, title, meta,
}: { priority: 'high' | 'medium' | 'low'; icon: any; title: string; meta: string }) {
  const ICON_CLASS = {
    high:   'bg-destructive/15 text-destructive ring-destructive/30',
    medium: 'bg-warning/15 text-warning ring-warning/30',
    low:    'bg-success/15 text-success ring-success/30',
  } as const;
  const BORDER_CLASS = {
    high:   'border-s-4 border-s-destructive',
    medium: 'border-s-4 border-s-warning',
    low:    'border-s-4 border-s-success',
  } as const;
  return (
    <div className={`flex items-center gap-3 rounded-lg bg-muted/30 p-3 ${BORDER_CLASS[priority]}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${ICON_CLASS[priority]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{meta}</div>
      </div>
    </div>
  );
}

function ActivityItem({
  icon: Icon, tone, title, meta,
}: { icon: any; tone: 'default' | 'success' | 'warning'; title: string; meta: string }) {
  const TONES = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
  } as const;
  return (
    <div className="flex items-start gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${TONES[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 text-sm">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{meta}</div>
      </div>
    </div>
  );
}
