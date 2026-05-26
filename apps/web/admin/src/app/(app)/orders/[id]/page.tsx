'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight, Building2, Calendar, CheckCircle2, Clock, MapPin, Package, Phone,
  ShieldCheck, Snowflake, Truck, User, Wallet, Weight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Currency } from '@/components/currency';
import { RouteMap } from '@/components/route-map';
import {
  ORDERS, bidsForOrder, companyById, coordsFor, distanceKm, estimatedDurationLabel,
  primaryRoadFor, timelineFor, formatDate, formatDateTime,
  normalizeOrder, COMMISSION_RATE, ESCROW_AUTO_RELEASE_HOURS, escrowAutoReleaseAt,
  escrowBreakdown, escrowMsRemaining,
} from '@naqla/shared-utils';

const TITLES: Record<string, string> = {
  CREATED: 'إنشاء الطلب', PUBLISHED: 'نشر الطلب', BID_RECEIVED: 'استلام عرض',
  BID_ACCEPTED: 'قبول عرض', CONFIRMED: 'تأكيد التحميل', PICKED_UP: 'تم الاستلام',
  IN_TRANSIT: 'في الطريق', DELIVERED: 'تم التسليم',
  PAYMENT_RELEASED: 'إفراج Escrow', COMPLETED: 'إغلاق الطلب', CANCELLED: 'إلغاء',
};

export default function AdminOrderDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // Real-API source of truth (with mock fallback through the api interceptor).
  // normalizeOrder aliases Prisma field names so the UI doesn't crash on
  // weight/requiredTruckType/_count.bids — same pattern as client/carrier
  // detail pages.
  // SWR is configured to auto-revalidate so the admin sees state transitions
  // (BIDDING → ASSIGNED → IN_TRANSIT → DELIVERED → COMPLETED) without
  // refreshing. 15s polling + on-focus refresh covers operational needs
  // without burning the API.
  const { data: orderData } = useSWR<typeof ORDERS[number] | null>(
    params?.id ? `/orders/${params.id}` : null,
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 15000 },
  );
  const order = normalizeOrder(orderData ?? null) ?? ORDERS.find((o) => o.id === params.id);

  if (!order) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">الطلب غير موجود</h3>
          <Button onClick={() => router.push('/orders')} className="mt-4">عودة</Button>
        </CardContent>
      </Card>
    );
  }

  const client = companyById(order.clientId);
  const provider = companyById(order.carrierId);
  type ApiOrderDriver = {
    id: string; assignedAt: string;
    driver: { id: string; status: string; user: { firstName: string; lastName: string; phone: string } };
  };
  const orderDrivers: ApiOrderDriver[] = (order as unknown as { orderDrivers?: ApiOrderDriver[] }).orderDrivers ?? [];
  // Prefer API bids (live data) — fall back to mock for offline demo.
  type ApiBid = { id: string; carrierId: string; providerId?: string; status: string; amount?: number; price?: number; estimatedDays?: number; truckType?: string; proposedPickupDate?: string; proposedDeliveryDate?: string };
  const apiBids = (order as unknown as { bids?: ApiBid[] }).bids;
  const bids = (Array.isArray(apiBids) && apiBids.length > 0 ? apiBids : bidsForOrder(order.id)) as ApiBid[];
  const timeline = timelineFor(order.id);
  const accepted = bids.find((b) => b.status === 'ACCEPTED');
  const effectivePickup = accepted?.proposedPickupDate ?? order.pickupDate;
  const effectiveDelivery =
    accepted?.proposedDeliveryDate
    ?? (order as { deliveryDate?: string }).deliveryDate
    ?? null;
  const showShipmentCard = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status);
  const showEscrow = order.status === 'DELIVERED' && (order.agreedPrice ?? 0) > 0;
  const deliveredAt = (timeline.find((t) => t.kind === 'DELIVERED')?.at) ?? new Date();

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        subtitle={`${order.originCity} ← ${order.destinationCity} · ${formatDateTime(order.createdAt)}`}
        actions={
          <>
            <StatusBadge status={order.status} />
            <Badge variant={order.mode === 'DIRECT' ? 'warning' : 'secondary'}>
              {order.mode === 'OPEN' ? 'سوق مفتوح' : 'إرسال مباشر'}
            </Badge>
            <Button variant="outline" onClick={() => router.push('/orders')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main col */}
        <div className="lg:col-span-2 space-y-6">
          <MapSection order={order} />

          {showShipmentCard && (
            <AdminShipmentStatus
              order={order}
              effectivePickup={effectivePickup}
              effectiveDelivery={effectiveDelivery}
              fromProviderBid={!!(accepted?.proposedDeliveryDate || accepted?.proposedPickupDate)}
            />
          )}

          {showEscrow && (
            <AdminEscrowSummary deliveredAt={deliveredAt} total={order.agreedPrice ?? 0} />
          )}

          {/* Bids */}
          {bids.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>العروض على الطلب</CardTitle>
                  <Badge variant="secondary">{bids.length} عرض</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {bids.map((bid) => {
                  const c = companyById(bid.providerId ?? bid.carrierId);
                  if (!c) return null;
                  return (
                    <div key={bid.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar>
                        <AvatarFallback>{c.nameAr.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.nameAr}</div>
                        <div className="text-xs text-muted-foreground">
                          {bid.estimatedDays} أيام · {bid.truckType}
                        </div>
                      </div>
                      <Currency amount={bid.price} />
                      <StatusBadge status={bid.status} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>سجل الأحداث</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative">
                {timeline.map((ev, i) => (
                  <li key={i} className="relative ps-8 pb-5 last:pb-0">
                    {i < timeline.length - 1 && (
                      <span aria-hidden className="absolute top-6 bottom-0 start-2.5 w-px bg-border" />
                    )}
                    <span className="absolute start-0 top-1 grid place-items-center h-5 w-5 rounded-full bg-primary border-2 border-background">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    </span>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{TITLES[ev.kind] ?? ev.kind}</div>
                        {(ev.note || ev.by) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {ev.note} {ev.by && <span>· {ev.by}</span>}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(ev.at, 'd MMM · HH:mm')}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar col */}
        <div className="space-y-6">
          {client && <PartyCard kind="العميل" company={client} onClick={() => router.push(`/companies/${client.id}`)} />}
          {provider && <PartyCard kind="الناقل" company={provider} onClick={() => router.push(`/companies/${provider.id}`)} />}

          {/* Assigned driver */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">السائق المُكلَّف</CardTitle></CardHeader>
            <CardContent>
              {orderDrivers.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  لم يُسند سائق بعد
                </div>
              ) : (
                <div className="space-y-3">
                  {orderDrivers.map((od) => {
                    const fullName = `${od.driver.user.firstName} ${od.driver.user.lastName}`;
                    const isOnTrip = od.driver.status === 'ON_TRIP';
                    return (
                      <div key={od.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted grid place-items-center shrink-0">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{fullName}</div>
                            <a href={`tel:${od.driver.user.phone}`} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary num" dir="ltr">
                              <Phone className="h-3 w-3" /> {od.driver.user.phone}
                            </a>
                          </div>
                        </div>
                        <dl className="divide-y text-xs">
                          <div className="flex justify-between py-1.5">
                            <dt className="text-muted-foreground">تاريخ الإسناد</dt>
                            <dd>{formatDate(od.assignedAt, 'd MMM · HH:mm')}</dd>
                          </div>
                          <div className="flex justify-between py-1.5 items-center">
                            <dt className="text-muted-foreground">الحالة</dt>
                            <dd>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                                ${isOnTrip ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${isOnTrip ? 'bg-warning' : 'bg-success'}`} />
                                {isOnTrip ? 'في رحلة' : 'متاح'}
                              </span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>تفاصيل الشحنة</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="الوصف" value={order.cargoDescription} />
                <Row label="الوزن" icon={Weight} value={<span className="num">{order.weightKg.toLocaleString('en-US')} كجم</span>} />
                <Row label="نوع الشاحنة" icon={Truck} value={order.truckType} />
                <Row label="تأمين" icon={ShieldCheck} value={order.requiresInsurance ? 'مطلوب' : '—'} />
                <Row label="تبريد" icon={Snowflake} value={order.requiresRefrigeration ? 'مطلوب' : '—'} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>المسار والمواعيد</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="من" icon={MapPin} value={order.originCity} />
                <Row label="إلى" icon={MapPin} value={order.destinationCity} />
                <Row label="موعد الاستلام" icon={Calendar} value={formatDate(order.pickupDate, 'd MMM · HH:mm')} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>المالية</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="ميزانية العميل" value={<Currency amount={order.clientBudget} />} />
                <Row label="السعر المتفق" value={<Currency amount={order.agreedPrice} />} />
                <Row label="عمولة المنصة" value={<Currency amount={order.commission ?? 0} />} />
                <Row label="صافي للناقل" value={<Currency amount={order.providerAmount ?? order.carrierAmount} />} />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function PartyCard({
  kind, company, onClick,
}: { kind: string; company: { nameAr: string; city: string; id: string }; onClick: () => void }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{kind}</CardTitle></CardHeader>
      <CardContent>
        <button onClick={onClick} className="flex items-center gap-3 w-full text-start hover:opacity-80 transition-opacity">
          <Avatar>
            <AvatarFallback>{company.nameAr.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate text-primary">{company.nameAr}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {company.city}
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-sm font-medium text-end shrink-0 max-w-[60%] leading-relaxed">{value ?? '—'}</dd>
    </div>
  );
}

function MapSection({ order }: { order: any }) {
  const o = coordsFor(order.originCity);
  const d = coordsFor(order.destinationCity);
  const km = distanceKm(o, d);
  const duration = estimatedDurationLabel(km);
  const road = primaryRoadFor(order.originCity, order.destinationCity);
  const progress = order.status === 'IN_TRANSIT' ? 0.55 : order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 1 : undefined;
  return (
    <Card>
      <RouteMap
        origin={{ ...o, label: order.originCity }}
        destination={{ ...d, label: order.destinationCity }}
        progress={progress}
        height={300}
        className="rounded-b-none border-b"
      />
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <RouteStat icon="📍" label="المسافة" value={<span className="num">{km.toLocaleString('en-US')} كم</span>} />
        <RouteStat icon="⏱" label="المدة المتوقعة" value={duration} />
        <RouteStat icon="🛣" label="الطريق الرئيسي" value={road} />
      </CardContent>
    </Card>
  );
}

/**
 * Read-only mirror of the client/carrier "shipment progress" card so admins
 * see the same status + pickup/delivery dates the parties see. No action
 * buttons — admins observe, not operate.
 */
function AdminShipmentStatus({
  order, effectivePickup, effectiveDelivery, fromProviderBid,
}: {
  order: any;
  effectivePickup: string | undefined;
  effectiveDelivery: string | null;
  fromProviderBid: boolean;
}) {
  const meta: Record<string, { text: string; step: 1 | 2 | 3; tone: 'info' | 'warning' | 'success' }> = {
    ASSIGNED:   { text: 'الطلب مُسند للناقل — قبل الاستلام',           step: 1, tone: 'info' },
    CONFIRMED:  { text: 'الناقل أكّد الموعد',                          step: 1, tone: 'info' },
    IN_TRANSIT: { text: 'الشحنة قيد التوصيل',                            step: 2, tone: 'warning' },
    DELIVERED:  { text: 'تم التسليم — Escrow في انتظار تأكيد العميل',   step: 3, tone: 'warning' },
    COMPLETED:  { text: 'مكتمل ✓',                                      step: 3, tone: 'success' },
  };
  const m = meta[order.status] ?? meta.ASSIGNED;
  const stepClass = (s: 1 | 2 | 3) =>
    s <= m.step
      ? (m.tone === 'success' ? 'bg-success text-success-foreground' : m.tone === 'warning' ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground')
      : 'bg-muted text-muted-foreground';
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">حالة الشحنة <StatusBadge status={order.status} /></CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2">
          {[
            { s: 1 as const, label: 'الاستلام',  icon: MapPin },
            { s: 2 as const, label: 'في الطريق', icon: Truck },
            { s: 3 as const, label: 'التسليم',  icon: CheckCircle2 },
          ].map((step, i, arr) => (
            <div key={step.s} className="flex items-center gap-2 flex-1">
              <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${stepClass(step.s)}`}>
                <step.icon className="h-4 w-4" />
              </div>
              <div className="text-xs font-medium">{step.label}</div>
              {i < arr.length - 1 && <div className={`flex-1 h-0.5 ${step.s < m.step ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">📅 موعد الاستلام</div>
            <div className="mt-0.5 font-medium">
              {effectivePickup ? formatDate(effectivePickup, 'EEEE d MMM') : '—'}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">📦 موعد التسليم المتوقع</div>
            <div className="mt-0.5 font-medium">
              {effectiveDelivery ? formatDate(effectiveDelivery, 'EEEE d MMM') : 'سيُحدَّد لاحقاً'}
            </div>
            {fromProviderBid && (
              <Badge variant="outline" className="mt-1 h-4 text-[10px]">من عرض الناقل</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Admin-facing escrow summary — same engine as the carrier countdown but
 * framed as "auto-release in X" for observability. Read-only; no action.
 */
function AdminEscrowSummary({ deliveredAt, total }: { deliveredAt: Date | string; total: number }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const msLeft = escrowMsRemaining(deliveredAt, now) ?? 0;
  const releaseAt = escrowAutoReleaseAt(deliveredAt)!;
  const breakdown = escrowBreakdown(total);
  const elapsed = ESCROW_AUTO_RELEASE_HOURS * 3600 * 1000 - msLeft;
  const pct = Math.min(100, Math.max(0, (elapsed / (ESCROW_AUTO_RELEASE_HOURS * 3600 * 1000)) * 100));
  const hours = Math.floor(msLeft / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);
  const secs = Math.floor((msLeft % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <Card className="border-warning/30 bg-warning/[0.04]">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-warning/15 text-warning grid place-items-center shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">Escrow — في انتظار الإفراج</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              الإفراج التلقائي بعد {ESCROW_AUTO_RELEASE_HOURS} ساعة من التسليم، أو فور تأكيد العميل (أيهما أسبق).
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-background border p-4">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            المتبقّي
          </div>
          <div className="flex items-baseline gap-2 font-mono num" dir="ltr">
            <span className="text-2xl font-bold">{pad(hours)}</span><span className="text-muted-foreground">س</span>
            <span className="text-2xl font-bold">{pad(mins)}</span><span className="text-muted-foreground">د</span>
            <span className="text-2xl font-bold">{pad(secs)}</span><span className="text-muted-foreground">ث</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-warning transition-[width]" style={{ width: `${pct}%` }} aria-hidden />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            الإفراج المتوقّع:{' '}
            <span className="num" dir="ltr">
              {releaseAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-background border p-4">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">قيمة الطلب</dt>
              <dd className="font-medium"><Currency amount={breakdown.total} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">عمولة المنصة ({Math.round(COMMISSION_RATE * 100)}%)</dt>
              <dd className="font-medium text-muted-foreground">−<Currency amount={breakdown.commission} /></dd>
            </div>
            <div className="flex justify-between pt-2 mt-1 border-t font-bold">
              <dt>صافي للناقل</dt>
              <dd className="text-success"><Currency amount={breakdown.providerAmount} /></dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

function RouteStat({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-2xl" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}
