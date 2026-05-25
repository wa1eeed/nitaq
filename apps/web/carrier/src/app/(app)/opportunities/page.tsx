'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Compass, MapPin, Radio, Search, ShieldCheck, Snowflake, Truck, UserSearch, Weight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PulsingBadge } from '@/components/pulsing-badge';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import {
  CURRENT_CARRIER_ID, SAUDI_CITIES, companyById, formatDate, openOpportunitiesForCarrier,
  normalizeOrderList, type Order,
} from '@naqla/shared-utils';

export default function CarrierOpportunitiesPage() {
  const [tab, setTab] = useState<'OPEN' | 'DIRECT'>('OPEN');
  const authedCompanyId = useAuthStore((s) => s.user?.companyId);
  const myCompanyId = authedCompanyId ?? CURRENT_CARRIER_ID;
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('ALL');
  const [sort, setSort] = useState('newest');

  // The backend list endpoint already filters by role + visibility (OPEN
  // marketplace + DIRECT-to-this-carrier + assigned-to-this-carrier).
  // `normalizeOrderList` aliases Prisma field names to the mock shape the
  // UI was written against. Mock fallback keeps demo mode usable offline.
  const { data } = useSWR<unknown>('/orders', fetcher);
  const opps: Order[] = useMemo(() => {
    const normalized = normalizeOrderList(data);
    const source = normalized.length > 0 ? normalized : openOpportunitiesForCarrier(CURRENT_CARRIER_ID);
    // The backend list endpoint bundles three buckets together: OPEN
    // marketplace, DIRECT-to-me, and orders already assigned to me. The
    // opportunities page should NOT show the third bucket — those aren't
    // opportunities anymore, they belong in /orders. Filter them out here.
    return source.filter((o) => {
      const assignedToMe =
        (o as { carrierId?: string }).carrierId === myCompanyId &&
        !['DRAFT', 'PUBLISHED', 'BIDDING'].includes(o.status);
      return !assignedToMe;
    });
  }, [data, myCompanyId]);
  // Per-order: which of THIS carrier's bids (if any) is on the order, used to
  // switch the row CTA between "قدّم عرضاً" / "تفاصيل" / "إعادة تقديم".
  type OppWithBids = Order & { bids?: Array<{ carrierId: string; status: string }> };
  const hasMyPendingBid = (o: Order) => {
    const bids = (o as OppWithBids).bids ?? [];
    return bids.some((b) => b.carrierId === myCompanyId && b.status === 'PENDING');
  };
  const myBidStatus = (o: Order): string | null => {
    const bids = (o as OppWithBids).bids ?? [];
    const mine = bids.find((b) => b.carrierId === myCompanyId);
    return mine?.status ?? null;
  };

  // `pool` = opps after the cross-tab filters (city + search) but BEFORE the
  // tab filter. Counts derived from `pool` therefore always match what the
  // user sees inside each tab — previously counts used raw `opps` while the
  // tab content respected city+search, causing "Tab says 1 but it's empty".
  const pool = useMemo(() => {
    let arr = opps;
    if (city !== 'ALL') arr = arr.filter((o) => o.originCity === city || o.destinationCity === city);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((o) =>
        o.cargoDescription.includes(search) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.originCity.includes(search) ||
        o.destinationCity.includes(search),
      );
    }
    return arr;
  }, [opps, city, search]);

  // Tab counts highlight opportunities the carrier hasn't bid on yet (the
  // actionable ones). Orders awaiting client decision still appear in the
  // lists with a "تفاصيل" CTA, but aren't counted as "new actions to take".
  const openCount  = pool.filter((o) => o.mode === 'OPEN'   && !hasMyPendingBid(o)).length;
  const directCount = pool.filter((o) => o.mode === 'DIRECT' && !hasMyPendingBid(o)).length;

  // Note: "new order" chime is handled centrally by NotificationCenter when
  // an unread notification arrives — not on every visit to this page.

  const filtered = useMemo(() => {
    // Tab filter applied on `pool` (already filtered by city + search) so the
    // displayed list matches the badge counts exactly.
    let arr = pool.filter((o) => o.mode === tab);
    if (sort === 'newest') arr = [...arr].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === 'weight') arr = [...arr].sort((a, b) => b.weightKg - a.weightKg);
    if (sort === 'pickup') arr = [...arr].sort((a, b) => +new Date(a.pickupDate) - +new Date(b.pickupDate));
    return arr;
  }, [pool, tab, sort]);

  return (
    <>
      <PageHeader title="سوق الفرص" subtitle="جميع طلبات النقل المتاحة لشركتك" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'OPEN' | 'DIRECT')}>
        <TabsList>
          <TabsTrigger value="OPEN" className="gap-2">
            <Radio className="h-3.5 w-3.5 me-0.5" />
            طلبات السوق المفتوح
            {openCount > 0 && <PulsingBadge count={openCount} tone="red" />}
          </TabsTrigger>
          <TabsTrigger value="DIRECT" className="gap-2">
            <UserSearch className="h-3.5 w-3.5 me-0.5" />
            طلبات خاصة
            {directCount > 0 && <PulsingBadge count={directCount} tone="amber" />}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن مدينة، نوع بضاعة، رقم طلب..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="كل المدن" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل المدن</SelectItem>
            {SAUDI_CITIES.slice(0, 20).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">الأحدث أولاً</SelectItem>
            <SelectItem value="weight">الأثقل وزناً</SelectItem>
            <SelectItem value="pickup">الأقرب استلاماً</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="لا توجد فرص متاحة"
          description="لم تُنشر أي فرص نقل حالياً — تحقق لاحقاً"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((o) => {
            const client = companyById(o.clientId);
            const isDirect = o.mode === 'DIRECT';
            const myStatus = myBidStatus(o);
            const isPending = myStatus === 'PENDING';
            const isRejected = myStatus === 'REJECTED';
            return (
              <Card key={o.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{o.originCity} ← {o.destinationCity}</h3>
                        <Badge variant={isDirect ? 'warning' : 'success'}>
                          {isDirect ? <><UserSearch className="h-3 w-3" /> موجّه لك</> : <><Radio className="h-3 w-3" /> سوق مفتوح</>}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-xs font-mono text-muted-foreground">{o.orderNumber}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{o.cargoDescription}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <Tag icon={<Weight className="h-3.5 w-3.5" />} label={`${o.weightKg.toLocaleString('en-US')} كجم`} />
                    <Tag icon={<Truck className="h-3.5 w-3.5" />} label={o.truckType} />
                    <Tag icon={<Calendar className="h-3.5 w-3.5" />} label={formatDate(o.pickupDate)} />
                    <Tag icon={<MapPin className="h-3.5 w-3.5" />} label={o.originAddress.split('،')[0] ?? '—'} />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {o.requiresInsurance && (
                      <Badge variant="default" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        تأمين
                      </Badge>
                    )}
                    {o.requiresRefrigeration && (
                      <Badge variant="default" className="gap-1">
                        <Snowflake className="h-3 w-3" />
                        تبريد
                      </Badge>
                    )}
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">العميل</div>
                      <div className="text-sm font-medium truncate max-w-[220px]">{client?.nameAr ?? '—'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {isPending ? 'عرضك قيد المراجعة لدى العميل'
                          : isRejected ? 'تم رفض عرضك السابق — يمكنك إعادة المحاولة'
                          : 'قدّم سعرك التنافسي'}
                      </div>
                    </div>
                    <Link href={`/opportunities/${o.id}`}>
                      <Button size="sm" variant={isPending ? 'outline' : 'default'}>
                        {isPending ? 'تفاصيل'
                          : isRejected ? 'إعادة تقديم'
                          : 'قدّم عرضاً'}
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Tag({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
      <span className="shrink-0">{icon}</span>
      <span className="truncate text-foreground">{label}</span>
    </div>
  );
}
