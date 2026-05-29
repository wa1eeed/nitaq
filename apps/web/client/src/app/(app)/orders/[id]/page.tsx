'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, api } from '@/lib/api';
import {
  AlertTriangle, ArrowRight, BadgeCheck, Briefcase, Building2, Calendar, CheckCircle2,
  Clock, MapPin, MessageSquare, Package, Phone, ShieldCheck, Shield, Star, Timer, Truck,
  User, UserSearch, Wifi, X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import { EscrowCountdown } from '@/components/escrow-countdown';
import { playSoundIfEnabled } from '@/lib/sound';
import { notify } from '@/lib/notify';
import {
  BIDS, DRIVERS, ORDERS, TRUCKS, bidsForOrder, companyById, formatDate, formatDateTime, formatRelative,
  lastRound, proposalForOrder, timelineFor,
  cancellationPolicy, escrowBreakdown, COMMISSION_RATE, pickupWindowLabel, estimateDeliveryDate,
  normalizeOrder,
  type DirectProposal, type Order,
} from '@naqla/shared-utils';

const TRUCK_LABELS: Record<string, string> = {
  CONSULTING: 'استشارات', DESIGN: 'تصميم', INSTALLATION: 'تركيب وتنصيب',
  MAINTENANCE: 'صيانة', TECHNICAL_SUPPORT: 'دعم تقني', TRAINING: 'تدريب',
  IT_SERVICES: 'خدمات تقنية', LOGISTICS: 'لوجستيات',
  PROJECT_MANAGEMENT: 'إدارة مشاريع', OTHER: 'أخرى',
};
const CARGO_LABELS: Record<string, string> = TRUCK_LABELS;
const TITLES: Record<string, string> = {
  CREATED: 'إنشاء الطلب', PUBLISHED: 'نشر الطلب', BID_RECEIVED: 'استلام عروض',
  BID_ACCEPTED: 'قبول العرض', CONFIRMED: 'تأكيد التحميل', PICKED_UP: 'تم الاستلام',
  IN_TRANSIT: 'قيد التنفيذ', DELIVERED: 'تم التسليم',
  PAYMENT_RELEASED: 'الإفراج عن المبلغ', COMPLETED: 'إغلاق الطلب', CANCELLED: 'إلغاء',
};

type SortKey = 'price' | 'rating' | 'days';

/** Days between two date-ish values; rounded toward zero. Returns 0 if either is missing. */
function dayDiff(later: string | Date | undefined, earlier: string | Date | undefined): number {
  if (!later || !earlier) return 0;
  const ms = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(ms / 86_400_000);
}

export default function ClientOrderDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // Real-API source of truth (with mock fallback via the api interceptor).
  // We still hold `ORDERS.find(...)` as a final fallback for offline UI demos.
  // The API response uses Prisma field names (weight, requiredTruckType,
  // _count.bids) — `normalizeOrder` aliases them onto the mock shape the UI
  // was written against, so accessing `order.weightKg` / `order.truckType`
  // no longer crashes when the backend wins the race.
  const { data: orderData, mutate: refetchOrder } = useSWR<Order>(
    params?.id ? `/orders/${params.id}` : null,
    fetcher,
  );
  const order = (normalizeOrder(orderData) ?? ORDERS.find((o) => o.id === params.id)) as Order | undefined;
  const { data: reviewsData, mutate: refetchReviews } = useSWR<{ reviews?: Array<{ reviewerId: string; rating: number }> }>(
    params?.id ? `/orders/${params.id}/reviews` : null,
    fetcher,
  );

  // ─── Hooks — MUST be declared unconditionally, BEFORE any early return ────
  // Otherwise React throws "Rendered more hooks than during the previous
  // render" because the first render (order=undefined) takes the early return
  // path with fewer hooks than the second render (order=defined). All hooks
  // below tolerate order being undefined.
  const [sort, setSort] = useState<SortKey>('price');
  const [acceptBid, setAcceptBid] = useState<typeof BIDS[number] | null>(null);
  // Dedicated state for the "تفاصيل" details dialog. Separate from
  // `acceptBid` so the dialog can show without triggering the accept flow.
  const [detailsBid, setDetailsBid] = useState<typeof BIDS[number] | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Prefer bids from the API response (live data — backend `findById()` includes
  // them via Prisma relation). Falls back to mock `bidsForOrder()` only when
  // the API isn't reachable + mock data is being served instead.
  const bids = useMemo(() => {
    if (!order) return [];
    const apiBids = (order as Order & { bids?: typeof BIDS }).bids;
    if (Array.isArray(apiBids) && apiBids.length > 0) return apiBids;
    return bidsForOrder(order.id);
  }, [order]);
  const timeline = useMemo(() => (order ? timelineFor(order.id) : []), [order]);

  const sortedBids = useMemo(() => {
    const arr = [...bids];
    // `bid.price` is set by normalizeBid (aliases API field `amount` → mock field `price`).
    // For rating sort we look at embedded `bid.provider` first (live API), then mock fallback.
    const providerOf = (bid: typeof BIDS[number]) =>
      (bid as typeof bid & { provider?: { rating?: number } }).provider ?? companyById(bid.carrierId);
    if (sort === 'price')  arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === 'rating') arr.sort((a, b) => (providerOf(b)?.rating ?? 0) - (providerOf(a)?.rating ?? 0));
    if (sort === 'days')   arr.sort((a, b) => (a.estimatedDays ?? 0) - (b.estimatedDays ?? 0));
    return arr;
  }, [bids, sort]);

  // ─── Early return — ONLY after all hooks have been called ────────────────
  if (!order) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">الطلب غير موجود</h3>
          <Button onClick={() => router.push('/orders')} className="mt-4">عودة لطلباتي</Button>
        </CardContent>
      </Card>
    );
  }

  const showBidComparison = order.status === 'BIDDING' && order.mode === 'OPEN';
  const showWaiting = order.status === 'PUBLISHED' && order.mode === 'DIRECT';
  // DELIVERED orders show the 72h escrow countdown until auto-release.
  // For the prototype we treat the most recent timeline event's `at` as the
  // delivery timestamp; in production this would be `order.deliveredAt`.
  const showEscrowCountdown = order.status === 'DELIVERED';
  const deliveredAt = (timeline.find((t) => t.kind === 'DELIVERED')?.at) ?? new Date();

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        subtitle={formatDateTime(order.createdAt)}
        actions={
          <>
            <StatusBadge status={order.status} />
            <OrderActionButtons
              order={order}
              onCancel={() => setCancelOpen(true)}
              onConfirmDelivery={() => setConfirmDeliveryOpen(true)}
              onOpenDispute={() => router.push('/disputes')}
            />
            <Button variant="outline" onClick={() => router.push('/orders')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {order.carrierId && <ProviderInfoCard order={order} />}

          {/* Status + pickup→delivery progress card. Visible once the order
              has a carrier assigned. Surfaces what the customer cares about
              most after acceptance: where is my shipment + when does it arrive? */}
          {['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
            <ShipmentProgressCard order={order} bids={bids} />
          )}

          {showEscrowCountdown && (
            <EscrowCountdown
              deliveredAt={deliveredAt}
              total={order.agreedPrice ?? 0}
              onConfirmEarly={() => setConfirmDeliveryOpen(true)}
            />
          )}

          {showWaiting && <DirectProposalView order={order} onRefetch={refetchOrder} />}

          {showBidComparison && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>العروض المستلمة</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{bids.length} عرض — قارن واختر الأنسب</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground me-1">ترتيب:</span>
                    {[
                      { k: 'price' as const,  l: 'الأرخص' },
                      { k: 'rating' as const, l: 'الأعلى تقييماً' },
                      { k: 'days' as const,   l: 'الأسرع' },
                    ].map((s) => (
                      <Button
                        key={s.k}
                        size="sm"
                        variant={sort === s.k ? 'default' : 'ghost'}
                        onClick={() => setSort(s.k)}
                      >
                        {s.l}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedBids.map((bid, i) => {
                  // Prefer the embedded `bid.provider` from the API response (live data).
                  // Fall back to `companyById` for mock-data demos where the provider
                  // lookup still has to walk the mock COMPANIES array.
                  type ExpandedBid = typeof bid & {
                    provider?: { id: string; nameAr: string; logo?: string | null; city?: string; rating?: number; completedTrips?: number; responseTimeMins?: number; insurance?: boolean };
                  };
                  const embeddedProvider = (bid as ExpandedBid).provider;
                  const fallbackProvider = companyById(bid.carrierId);
                  const c = (embeddedProvider ?? fallbackProvider) as NonNullable<typeof fallbackProvider> | undefined;
                  if (!c) return null;
                  const isBest = sort === 'price' && i === 0;
                  return (
                    <div key={bid.id} className="p-4 rounded-lg border hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{(c.nameAr ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{c.nameAr}</h4>
                            {isBest && <Badge variant="success">الأرخص</Badge>}
                            {c.insurance && <Badge variant="default">تأمين</Badge>}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              <span className="num">{c.rating?.toFixed(1)}</span>
                              <span>({c.completedTrips} طلب)</span>
                            </span>
                            <span>· {c.city}</span>
                            <span>· استجابة {c.responseTimeMins} د</span>
                            <span>· {TRUCK_LABELS[bid.truckType]}</span>
                          </div>
                          {bid.notes && (
                            <p className="mt-2 text-sm bg-muted/50 rounded-md p-2.5">&ldquo;{bid.notes}&rdquo;</p>
                          )}
                          {/* Prominent alerts when the carrier proposed dates that differ
                              from what the client asked for. Visible above the ETA card so
                              the client can't miss the change before accepting. */}
                          {bid.proposedPickupDate && bid.proposedPickupDate !== order.pickupDate && (
                            <div className="mt-3 rounded-md border-2 border-warning/40 bg-warning/[0.06] p-3 text-sm flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold">موعد استلام آخر تم اقتراحه: </span>
                                {formatDate(bid.proposedPickupDate, 'EEEE d MMM')}
                                {(() => {
                                  const d = dayDiff(bid.proposedPickupDate, order.pickupDate);
                                  if (d === 0) return null;
                                  return (
                                    <span className="ms-1 text-xs text-muted-foreground">
                                      ({d > 0 ? `بعد ${d} ${d === 1 ? 'يوم' : 'أيام'}` : `قبل ${Math.abs(d)} ${Math.abs(d) === 1 ? 'يوم' : 'أيام'}`} من موعدك)
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                          {bid.proposedDeliveryDate && order.deliveryDate && bid.proposedDeliveryDate !== order.deliveryDate && (
                            <div className="mt-2 rounded-md border-2 border-warning/40 bg-warning/[0.06] p-3 text-sm flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold">موعد تسليم آخر تم اقتراحه: </span>
                                {formatDate(bid.proposedDeliveryDate, 'EEEE d MMM')}
                                {(() => {
                                  const d = dayDiff(bid.proposedDeliveryDate, order.deliveryDate);
                                  if (d === 0) return null;
                                  return (
                                    <span className="ms-1 text-xs text-muted-foreground">
                                      ({d > 0 ? `بعد ${d} ${d === 1 ? 'يوم' : 'أيام'}` : `قبل ${Math.abs(d)} ${Math.abs(d) === 1 ? 'يوم' : 'أيام'}`} من موعدك)
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                          {/* ETA card — at-a-glance pickup + delivery */}
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs rounded-md border bg-muted/20 p-2.5">
                            <div>
                              <div className="text-muted-foreground">📅 الاستلام</div>
                              <div className="font-medium">
                                {formatDate(bid.proposedPickupDate ?? order.pickupDate, 'EEEE d MMM')}
                                {order.pickupWindow && <span className="ms-1 text-muted-foreground">· {pickupWindowLabel(order.pickupWindow).split(' ')[1]}</span>}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">📦 التسليم المتوقّع</div>
                              <div className="font-medium">
                                {bid.proposedDeliveryDate
                                  ? formatDate(bid.proposedDeliveryDate, 'EEEE d MMM')
                                  : (order.deliveryDate
                                      ? formatDate(order.deliveryDate, 'EEEE d MMM')
                                      : (bid.estimatedDays
                                          ? formatDate(
                                              estimateDeliveryDate(
                                                bid.proposedPickupDate ?? order.pickupDate,
                                                bid.estimatedDays,
                                                bid.estimatedHours ?? 0,
                                              ),
                                              'EEEE d MMM',
                                            )
                                          : 'سيُحدَّد لاحقاً'))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-baseline gap-3">
                              <div className="text-xl font-bold num">{(bid.price ?? 0).toLocaleString('en-US')}</div>
                              <span className="text-xs text-muted-foreground">ر.س.</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" onClick={() => setDetailsBid(bid)}>تفاصيل</Button>
                              <Button onClick={() => setAcceptBid(bid)}>قبول هذا العرض</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Show the standalone timeline only when there's no other status surface
              (i.e. order is in DRAFT/PUBLISHED/BIDDING/CANCELLED). For ASSIGNED+
              the timeline is folded into ShipmentProgressCard above. */}
          {!showBidComparison && !showWaiting && !['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
            <Card>
              <CardHeader><CardTitle>سجل الأحداث</CardTitle></CardHeader>
              <CardContent>
                <ol className="relative">
                  {timeline.map((ev, i) => (
                    <li key={i} className="relative ps-8 pb-5 last:pb-0">
                      {i < timeline.length - 1 && <span aria-hidden className="absolute top-6 bottom-0 start-2.5 w-px bg-border" />}
                      <span className="absolute start-0 top-1 grid place-items-center h-5 w-5 rounded-full bg-primary border-2 border-background">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{TITLES[ev.kind] ?? ev.kind}</div>
                          {(ev.note || ev.by) && <div className="text-xs text-muted-foreground mt-0.5">{ev.note} {ev.by && `· ${ev.by}`}</div>}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatDate(ev.at, 'd MMM · HH:mm')}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* ─── Rate the Provider card — shown after order is COMPLETED ─── */}
          {order.status === 'COMPLETED' && order.carrierId && (() => {
            const myCompanyId = order.clientId;
            const alreadyReviewed = (reviewsData?.reviews ?? []).some(
              (r: { reviewerId: string; rating: number }) => r.reviewerId === myCompanyId || reviewSubmitted
            );

            if (alreadyReviewed) {
              return (
                <Card className="border-success/30 bg-success/[0.03]">
                  <CardContent className="py-10 text-center">
                    <div className="text-3xl mb-2">⭐</div>
                    <h3 className="font-semibold text-success">شكراً على تقييمك</h3>
                    <p className="mt-1 text-sm text-muted-foreground">ساهم تقييمك في تحسين جودة الخدمة على المنصة</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-warning fill-warning" />
                    قيّم المزوّد
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">تقييمك يساعد الشركات الأخرى في اتخاذ قرارات أفضل</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Star picker */}
                  <div className="flex items-center gap-1.5 justify-center">
                    {[1,2,3,4,5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 rounded-md hover:bg-warning/10 transition-colors"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= (reviewHover || reviewRating)
                              ? 'text-warning fill-warning'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {reviewRating > 0 && (
                    <p className="text-center text-sm font-medium text-muted-foreground">
                      {['', 'سيئ', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][reviewRating]}
                    </p>
                  )}

                  {/* Comment */}
                  <div className="space-y-2">
                    <Label>تعليق (اختياري)</Label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-md border bg-background text-sm"
                      placeholder="شاركنا رأيك في الخدمة المقدّمة..."
                    />
                  </div>

                  <Button
                    className="w-full"
                    disabled={reviewRating === 0 || reviewSubmitting}
                    onClick={async () => {
                      if (!reviewRating || !order) return;
                      setReviewSubmitting(true);
                      try {
                        await api.post(`/orders/${order.id}/review`, {
                          rating: reviewRating,
                          comment: reviewComment || undefined,
                        });
                        setReviewSubmitted(true);
                        notify.success('تم إرسال التقييم', 'شكراً على مشاركتك');
                        await refetchReviews();
                      } catch (err) {
                        notify.error(err, 'فشل إرسال التقييم');
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                  >
                    <Star className="h-4 w-4" />
                    {reviewSubmitting ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
                  </Button>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        <div className="space-y-6">
          {/* Card 1: معلومات الطلب */}
          <Card>
            <CardHeader><CardTitle>معلومات الطلب</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Order number */}
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">رقم الطلب</div>
                <div className="font-mono text-lg font-bold text-primary">{order.orderNumber}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(order.createdAt)}</div>
              </div>

              {/* Order mode badge */}
              <div>
                <Badge variant={order.mode === 'OPEN' ? 'default' : 'secondary'}>
                  {order.mode === 'OPEN' ? 'سوق مفتوح' : 'إرسال مباشر'}
                </Badge>
              </div>

              <div className="border-t pt-4 space-y-3">
                {/* Service type */}
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">نوع الخدمة</div>
                    <div className="text-sm font-medium">
                      {(order.cargoType && CARGO_LABELS[order.cargoType]) || order.cargoType || '—'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {order.cargoDescription && (
                  <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {order.cargoDescription}
                  </div>
                )}

                {/* Insurance */}
                {order.requiresInsurance && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                    <Badge variant="success">تأمين مطلوب</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: الموقع والموعد */}
          <Card>
            <CardHeader><CardTitle>الموقع والموعد</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {/* Delivery mode */}
              {(order as any).deliveryMode && (() => {
                const dm = (order as any).deliveryMode as string;
                const modeMap: Record<string, { label: string; Icon: typeof Wifi }> = {
                  ON_SITE:     { label: 'في موقع شركتنا',        Icon: Building2 },
                  REMOTE:      { label: 'عن بُعد / إلكترونياً',  Icon: Wifi },
                  AT_PROVIDER: { label: 'في مقر المزوّد',         Icon: Briefcase },
                };
                const m = modeMap[dm];
                if (!m) return null;
                const ModeIcon = m.Icon;
                return (
                  <div className="flex items-start gap-2">
                    <ModeIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">طريقة الخدمة</div>
                      <div className="text-sm font-medium">{m.label}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Service location */}
              {(order.originCity || order.originAddress) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">موقع التنفيذ</div>
                    <div className="text-sm font-medium">{order.originCity}</div>
                    {order.originAddress && (
                      <div className="text-xs text-muted-foreground">{order.originAddress}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Pickup date */}
              {order.pickupDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">تاريخ البدء</div>
                    <div className="text-sm font-medium">{formatDate(order.pickupDate, 'EEEE d MMM yyyy')}</div>
                  </div>
                </div>
              )}

              {/* Pickup window */}
              {(order as any).pickupWindow && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">وقت الاستلام</div>
                    <div className="text-sm font-medium">{pickupWindowLabel((order as any).pickupWindow)}</div>
                  </div>
                </div>
              )}

              {/* Expected delivery/completion date */}
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">موعد الإنجاز المتوقع</div>
                  <div className="text-sm font-medium">
                    {order.deliveryDate
                      ? formatDate(order.deliveryDate, 'EEEE d MMM yyyy')
                      : 'سيُحدَّد لاحقاً'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: مزوّد الخدمة (compact) — only when provider is assigned */}
          {order.carrierId && ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status) && (
            <SidebarProviderCard order={order} />
          )}
        </div>
      </div>

      {/* Accept bid confirmation */}
      <Dialog open={!!acceptBid} onOpenChange={(o) => !o && setAcceptBid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد قبول العرض</DialogTitle>
            <DialogDescription>سيُسند الطلب للمزوّد ويُحجَز المبلغ في Escrow. تُرفض باقي العروض تلقائياً.</DialogDescription>
          </DialogHeader>
          {acceptBid && (() => {
            const provider = (acceptBid as typeof acceptBid & { provider?: { id: string; nameAr: string; logo?: string | null; rating?: number; completedTrips?: number } }).provider
              ?? companyById(acceptBid.carrierId);
            return (
              <div className="space-y-3 py-2">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{(provider?.nameAr ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold">{provider?.nameAr}</div>
                      <div className="text-xs text-muted-foreground">
                        <Star className="h-3 w-3 inline fill-warning text-warning" /> {provider?.rating?.toFixed(1)} · {provider?.completedTrips} طلب
                      </div>
                    </div>
                  </div>
                  <dl className="space-y-1.5 text-sm pt-2 border-t">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">السعر</dt>
                      <dd className="font-bold"><Currency amount={acceptBid.price} /></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">المدة المقدّرة</dt>
                      <dd className="font-medium num">{acceptBid.estimatedDays} {acceptBid.estimatedDays === 1 ? 'يوم' : 'أيام'}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-md bg-info/10 border border-info/30 p-3 flex items-start gap-2 text-xs">
                  <ShieldCheck className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">
                    سيُحتجز المبلغ في حساب Escrow الآمن، ولا يُحوّل للمزوّد إلا بعد تأكيد الإنجاز.
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptBid(null)}>إلغاء</Button>
            <Button
              onClick={async () => {
                if (!acceptBid || !order) return;
                try {
                  // POST /orders/:orderId/bids/:bidId/accept — atomic on the backend:
                  //   • this bid → ACCEPTED
                  //   • other bids → REJECTED
                  //   • order → ASSIGNED with agreedPrice + commission
                  //   • Payment row created in HELD state
                  await api.post(`/orders/${order.id}/bids/${acceptBid.id}/accept`, {});
                  notify.success('تم قبول العرض', 'الطلب انتقل إلى حالة ASSIGNED');
                  await refetchOrder();
                  setAcceptBid(null);
                } catch (err: unknown) {
                  notify.error(err, 'فشل قبول العرض');
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> تأكيد القبول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bid details dialog — opens from "تفاصيل" on a bid row. Shows the
          carrier card + ETA + notes, and offers accept/reject/close so the
          client can decide without leaving the order page. */}
      <Dialog open={!!detailsBid} onOpenChange={(o) => !o && setDetailsBid(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل عرض المزوّد</DialogTitle>
            <DialogDescription>راجع المعلومات قبل القبول أو الرفض.</DialogDescription>
          </DialogHeader>
          {detailsBid && (() => {
            const provider = (detailsBid as typeof detailsBid & { provider?: { id: string; nameAr: string; logo?: string | null; rating?: number; completedTrips?: number; city?: string; responseTimeMins?: number; insurance?: boolean } }).provider
              ?? companyById(detailsBid.carrierId);
            const pickupDiff = dayDiff(detailsBid.proposedPickupDate, order.pickupDate);
            const deliveryDiff = dayDiff(detailsBid.proposedDeliveryDate, order.deliveryDate);
            return (
              <div className="space-y-3 py-2">
                {/* Provider card */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{(provider?.nameAr ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{provider?.nameAr}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span className="num">{provider?.rating?.toFixed(1) ?? '—'}</span>
                          {provider?.completedTrips != null && <span>({provider.completedTrips} طلب)</span>}
                        </span>
                        {provider?.city && <span>· {provider.city}</span>}
                        {provider?.insurance && <Badge variant="default" className="h-4 text-[10px] gap-1"><Shield className="h-3 w-3" /> تأمين</Badge>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price row */}
                <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">السعر المعروض</span>
                  <span className="text-xl font-bold num">
                    {(detailsBid.price ?? 0).toLocaleString('en-US')}
                    <span className="ms-1 text-xs text-muted-foreground">ر.س</span>
                  </span>
                </div>

                {/* Pickup + delivery rows with diff highlight */}
                <div className="rounded-lg border bg-card p-3 space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">📅 الاستلام</div>
                      <div className="font-medium">{formatDate(detailsBid.proposedPickupDate ?? order.pickupDate, 'EEEE d MMM')}</div>
                    </div>
                    {detailsBid.proposedPickupDate && detailsBid.proposedPickupDate !== order.pickupDate && (
                      <Badge variant="warning" className="text-[10px] shrink-0">
                        موعد بديل {pickupDiff !== 0 && `· ${pickupDiff > 0 ? '+' : ''}${pickupDiff} ${Math.abs(pickupDiff) === 1 ? 'يوم' : 'أيام'}`}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-3 pt-2 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">📦 التسليم المتوقّع</div>
                      <div className="font-medium">
                        {detailsBid.proposedDeliveryDate
                          ? formatDate(detailsBid.proposedDeliveryDate, 'EEEE d MMM')
                          : (order.deliveryDate ? formatDate(order.deliveryDate, 'EEEE d MMM') : 'سيُحدَّد لاحقاً')}
                      </div>
                    </div>
                    {detailsBid.proposedDeliveryDate && order.deliveryDate && detailsBid.proposedDeliveryDate !== order.deliveryDate && (
                      <Badge variant="warning" className="text-[10px] shrink-0">
                        موعد بديل {deliveryDiff !== 0 && `· ${deliveryDiff > 0 ? '+' : ''}${deliveryDiff} ${Math.abs(deliveryDiff) === 1 ? 'يوم' : 'أيام'}`}
                      </Badge>
                    )}
                  </div>
                </div>

                {detailsBid.notes && (
                  <div className="rounded-md bg-muted/40 p-3 text-sm">
                    <div className="text-xs text-muted-foreground mb-1">ملاحظات المزوّد</div>
                    {detailsBid.notes}
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDetailsBid(null)}
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" /> إغلاق
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!detailsBid || !order) return;
                try {
                  await api.post(`/orders/${order.id}/bids/${detailsBid.id}/reject`, {});
                  notify.success('تم رفض العرض');
                  await refetchOrder();
                  setDetailsBid(null);
                } catch (err: unknown) {
                  notify.error(err, 'فشل رفض العرض');
                }
              }}
            >
              <X className="h-4 w-4" /> رفض
            </Button>
            <Button
              onClick={() => {
                if (!detailsBid) return;
                setAcceptBid(detailsBid);
                setDetailsBid(null);
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> قبول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel order */}
      <CancelOrderDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        order={order}
        reason={cancelReason}
        setReason={setCancelReason}
        reasonText={cancelReasonText}
        setReasonText={setCancelReasonText}
        onConfirm={async () => {
          try {
            await api.post(`/orders/${order.id}/cancel`, {
              reason: cancelReason + (cancelReasonText ? ` — ${cancelReasonText}` : ''),
            });
            notify.success('تم إلغاء الطلب');
            await refetchOrder();
            setCancelOpen(false);
          } catch (err: unknown) {
            notify.error(err, 'فشل إلغاء الطلب');
          }
        }}
      />

      {/* Confirm delivery */}
      <Dialog open={confirmDeliveryOpen} onOpenChange={setConfirmDeliveryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد اكتمال الخدمة</DialogTitle>
            <DialogDescription>سيتم إفراج مبلغ Escrow للمزوّد بعد خصم العمولة.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-success/10 border border-success/30 p-3 flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                بتأكيدك الاكتمال تُقرّ بأن الخدمة أُنجزت على النحو المطلوب. لن يمكنك فتح نزاع بعد التأكيد إلا في حالة عيب خفي يظهر لاحقاً.
              </p>
            </div>
            <p className="text-sm">سيُحوّل للمزوّد: <Currency amount={(order.agreedPrice ?? 0) * 0.92} /> (بعد خصم 8% عمولة)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeliveryOpen(false)}>إلغاء</Button>
            <Button
              onClick={async () => {
                try {
                  // POST /orders/:id/complete → order COMPLETED + Payment RELEASED
                  await api.post(`/orders/${order.id}/complete`, {});
                  playSoundIfEnabled('orderCompleted');
                  notify.success('تم تأكيد الاكتمال', 'سيُفرَج المبلغ للمزوّد خلال لحظات');
                  await refetchOrder();
                  setConfirmDeliveryOpen(false);
                } catch (err: unknown) {
                  notify.error(err, 'فشل تأكيد الاستلام');
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> تأكيد الاكتمال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Order action buttons (rule-based by status) ─────────────────────

function OrderActionButtons({
  order, onCancel, onConfirmDelivery, onOpenDispute,
}: {
  order: Order;
  onCancel: () => void;
  onConfirmDelivery: () => void;
  onOpenDispute: () => void;
}) {
  const canCancel = ['DRAFT', 'PUBLISHED', 'BIDDING', 'ASSIGNED', 'CONFIRMED'].includes(order.status);
  const canConfirmDelivery = order.status === 'DELIVERED';
  const canDispute = ['IN_TRANSIT', 'DELIVERED'].includes(order.status);

  return (
    <>
      {canConfirmDelivery && (
        <Button onClick={onConfirmDelivery} className="bg-success hover:bg-success/90 text-success-foreground">
          <CheckCircle2 className="h-4 w-4" /> تأكيد الاستلام
        </Button>
      )}
      {canDispute && (
        <Button variant="outline" onClick={onOpenDispute}>
          <Shield className="h-4 w-4" /> فتح نزاع
        </Button>
      )}
      {canCancel && (
        <Button variant="outline" onClick={onCancel} className="text-destructive hover:text-destructive border-destructive/30">
          <X className="h-4 w-4" /> إلغاء الطلب
        </Button>
      )}
    </>
  );
}

// ─── Cancel dialog with rule-based fees ──────────────────────────────

const CANCEL_REASONS = [
  'لم أعد بحاجة للخدمة',
  'وجدت بديلاً أرخص',
  'تغيّر الموعد أو الوجهة',
  'مشكلة في الخدمة',
  'المزوّد لا يستجيب',
  'أخرى',
];

function CancelOrderDialog({
  open, onClose, order, reason, setReason, reasonText, setReasonText, onConfirm,
}: {
  open: boolean; onClose: () => void; order: Order;
  reason: string; setReason: (v: string) => void;
  reasonText: string; setReasonText: (v: string) => void;
  onConfirm: () => void;
}) {
  // Pull the cancellation policy from the workflow engine (single source of
  // truth: shared-utils/workflow-engine.ts). Renders the appropriate tier-
  // specific summary card.
  const policy = cancellationPolicy(order);
  const beforePublish = policy.tier === 'FREE' && order.status === 'DRAFT';
  const beforeAssign  = policy.tier === 'FREE' && order.status !== 'DRAFT';
  const afterAssign   = policy.tier === 'FEE_10_PERCENT';
  const inTransit     = policy.tier === 'DISPUTE_ONLY';

  const total = order.agreedPrice ?? order.clientBudget ?? 0;
  const fee = policy.feeAmount;
  const refund = policy.refundAmount;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إلغاء الطلب {order.orderNumber}</DialogTitle>
          <DialogDescription>راجع تفاصيل الإلغاء بحسب الحالة الحالية للطلب</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Fee rules summary */}
          {(beforePublish || beforeAssign) && (
            <div className="rounded-md bg-success/10 border border-success/30 p-3 flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">إلغاء مجاني</p>
                <p className="mt-1 text-xs text-muted-foreground">لا تُطبَّق رسوم — الطلب لم يُسند لمزوّد بعد.</p>
              </div>
            </div>
          )}

          {afterAssign && (
            <div className="rounded-md bg-warning/10 border border-warning/30 p-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">رسوم إلغاء 10%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  تُخصم رسوم تعويضاً للمزوّد الذي خصّص موارده لهذا الطلب.
                </p>
                <dl className="mt-2 pt-2 border-t border-warning/30 text-xs space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">قيمة الطلب</dt>
                    <dd className="font-medium"><Currency amount={total} /></dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">رسوم الإلغاء (10%)</dt>
                    <dd className="font-medium text-destructive">−<Currency amount={fee} /></dd>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-warning/30 font-semibold">
                    <dt>المبلغ المُسترَد</dt>
                    <dd className="text-success"><Currency amount={refund} /></dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {inTransit && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2 text-sm">
              <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">لا يمكن الإلغاء</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  الخدمة قيد التنفيذ. يمكنك فتح نزاع إذا كانت هناك مشكلة.
                </p>
              </div>
            </div>
          )}

          {!inTransit && (
            <>
              <div className="space-y-2">
                <Label>سبب الإلغاء</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="اختر السبب" /></SelectTrigger>
                  <SelectContent>
                    {CANCEL_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات إضافية (اختياري)</Label>
                <textarea
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-md border bg-background text-sm"
                  placeholder="اشرح السبب بمزيد من التفصيل..."
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>تراجع</Button>
          {!inTransit && (
            <Button variant="destructive" onClick={onConfirm} disabled={!reason}>
              <X className="h-4 w-4" /> تأكيد الإلغاء
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-sm font-medium text-end max-w-[60%] leading-relaxed">{value ?? '—'}</dd>
    </div>
  );
}

/**
 * Status header + pickup→delivery progress + tracking events list.
 * Rendered once the order is ASSIGNED+ so the client sees a clear "where
 * is my shipment, when does it arrive, what just happened?" answer
 * without scrolling through bid history.
 */
function ShipmentProgressCard({ order, bids }: { order: Order; bids: typeof BIDS }) {
  const accepted = bids.find((b) => b.status === 'ACCEPTED');
  const effectivePickup = accepted?.proposedPickupDate ?? order.pickupDate;
  const effectiveDelivery =
    accepted?.proposedDeliveryDate
    ?? accepted?.estimatedDeliveryDate
    ?? order.deliveryDate
    ?? null;
  const events = timelineFor(order.id);
  // Map status → (helper text, which of the 3 steps is the current focus).
  const meta: Record<string, { text: string; step: 1 | 2 | 3; tone: 'info' | 'warning' | 'success' }> = {
    ASSIGNED:   { text: 'تم إسناد الطلب — المزوّد يحضّر للتنفيذ',  step: 1, tone: 'info' },
    CONFIRMED:  { text: 'المزوّد أكّد الموعد — جارٍ البدء بالتنفيذ', step: 1, tone: 'info' },
    IN_TRANSIT: { text: 'الخدمة قيد التنفيذ',                        step: 2, tone: 'warning' },
    DELIVERED:  { text: 'تم التسليم — يرجى تأكيد الاستلام',         step: 3, tone: 'warning' },
    COMPLETED:  { text: 'الطلب مكتمل ✓',                          step: 3, tone: 'success' },
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
            <CardTitle className="flex items-center gap-2">حالة الطلب <StatusBadge status={order.status} /></CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 3-step progress: استلام → قيد التنفيذ → تسليم */}
        <div className="flex items-center gap-2">
          {[
            { s: 1 as const, label: 'الاستلام',  icon: MapPin },
            { s: 2 as const, label: 'قيد التنفيذ', icon: Briefcase },
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

        {/* Pickup + delivery dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">📅 موعد الاستلام</div>
            <div className="mt-0.5 font-medium">
              {effectivePickup ? formatDate(effectivePickup, 'EEEE d MMM') : '—'}
            </div>
            {accepted?.proposedPickupDate && accepted.proposedPickupDate !== order.pickupDate && (
              <Badge variant="warning" className="mt-1 h-4 text-[10px]">موعد بديل من المزوّد</Badge>
            )}
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">📦 موعد التسليم المتوقع</div>
            <div className="mt-0.5 font-medium">
              {effectiveDelivery ? formatDate(effectiveDelivery, 'EEEE d MMM') : 'سيُحدَّد لاحقاً'}
            </div>
            {accepted?.proposedDeliveryDate && order.deliveryDate && accepted.proposedDeliveryDate !== order.deliveryDate && (
              <Badge variant="warning" className="mt-1 h-4 text-[10px]">موعد بديل من المزوّد</Badge>
            )}
          </div>
        </div>

        {/* Tracking events */}
        {events.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">تتبّع الطلب</div>
            <ol className="relative space-y-3">
              {events.map((ev, i) => (
                <li key={i} className="relative ps-7">
                  {i < events.length - 1 && <span aria-hidden className="absolute top-5 bottom-[-12px] start-[9px] w-px bg-border" />}
                  <span className="absolute start-0 top-1 grid place-items-center h-5 w-5 rounded-full bg-primary border-2 border-background">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </span>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{TITLES[ev.kind] ?? ev.kind}</div>
                      {(ev.note || ev.by) && <div className="text-xs text-muted-foreground mt-0.5">{ev.note} {ev.by && `· ${ev.by}`}</div>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(ev.at, 'd MMM · HH:mm')}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ApiProvider = { id: string; nameAr: string; nameEn?: string; city?: string; contactPhone?: string; contactEmail?: string; rating?: number; completedTrips?: number; responseTimeMins?: number; insurance?: boolean };
type ApiOrderFull = Order & { provider?: ApiProvider };

function ProviderInfoCard({ order }: { order: Order }) {
  // Use API-provided provider data when available, fall back to mock
  const apiOrder = order as ApiOrderFull;
  const providerFromApi = apiOrder.provider;
  const providerFromMock = companyById(order.carrierId);
  const provider = providerFromApi ?? providerFromMock;
  if (!provider) return null;

  // Accepted bid from API (bids injected by normalizeOrder) or from mock
  type ApiBid = { id: string; status: string; price?: number; amount?: number; estimatedDays?: number };
  const apiBids = (order as Order & { bids?: ApiBid[] }).bids;
  const acceptedBid = apiBids?.find((b) => b.status === 'ACCEPTED') ?? BIDS.find((b) => b.orderId === order.id && b.status === 'ACCEPTED');

  // Service and employee data still come from mocks (no dedicated API endpoint on order detail)
  const assignedService =
    TRUCKS.find((t) => t.carrierId === provider.id && t.status === 'ON_TRIP') ??
    TRUCKS.find((t) => t.carrierId === provider.id);
  const employee = assignedService?.assignedDriverId
    ? DRIVERS.find((d) => d.id === assignedService.assignedDriverId)
    : DRIVERS.find((d) => d.carrierId === provider.id);

  const initials = (provider.nameAr ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('');
  const employeeInitials = (employee?.fullName ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('');

  return (
    <Card className="border-success/30 bg-success/[0.03]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-success/15 text-success grid place-items-center">
              <BadgeCheck className="h-4 w-4" />
            </div>
            <CardTitle>مزوّد الخدمة المُعتمد</CardTitle>
          </div>
          <Badge variant="success">تم قبول العرض</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Provider company header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-base">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-base">{provider.nameAr}</h4>
              {(provider as { insurance?: boolean }).insurance && <Badge variant="default">تأمين شامل</Badge>}
              <Badge variant="outline">موثّق</Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {provider.rating && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span className="num">{provider.rating.toFixed(1)}</span>
                  {(provider as { completedTrips?: number }).completedTrips != null && (
                    <span>({(provider as { completedTrips?: number }).completedTrips} طلب)</span>
                  )}
                </span>
              )}
              {provider.city && <span>· {provider.city}</span>}
              {provider.contactPhone && (
                <span dir="ltr" className="num">{provider.contactPhone}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {provider.contactPhone && (
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${provider.contactPhone}`}>
                  <Phone className="h-3.5 w-3.5" /> اتصال
                </a>
              </Button>
            )}
            {provider.contactEmail && (
              <Button size="sm" variant="ghost" asChild>
                <a href={`mailto:${provider.contactEmail}`}>
                  <MessageSquare className="h-3.5 w-3.5" /> إيميل
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Service + Employee split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase mb-3">
              <Briefcase className="h-3.5 w-3.5" />
              الخدمة المخصّصة
            </div>
            {assignedService ? (
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">نوع الخدمة</dt>
                  <dd className="font-medium">{TRUCK_LABELS[assignedService.truckType] ?? assignedService.truckType}</dd>
                </div>
                {assignedService.modelYear && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">السنة</dt>
                    <dd className="font-medium num">{assignedService.modelYear}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="text-xs text-muted-foreground py-2">سيتم تخصيص الخدمة قريباً</div>
            )}
          </div>

          {/* Employee */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase mb-3">
              <User className="h-3.5 w-3.5" />
              الموظف
            </div>
            {employee ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>{employeeInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{employee.fullName}</div>
                    <div className="text-xs text-muted-foreground">{employee.licenseClass}</div>
                  </div>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">الجوال</dt>
                    <dd className="font-medium num" dir="ltr">{employee.phone}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">المهام المنجزة</dt>
                    <dd className="font-medium num">{employee.totalTrips.toLocaleString('en-US')}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <div className="text-xs text-muted-foreground py-2">سيتم تخصيص الموظف قريباً</div>
            )}
          </div>
        </div>

        {/* Agreed price + ETA */}
        {(order.agreedPrice || acceptedBid) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-muted-foreground">السعر المتّفق عليه</div>
              <div className="mt-0.5 text-lg font-bold">
                <Currency amount={order.agreedPrice ?? acceptedBid?.price ?? 0} />
              </div>
            </div>
            {acceptedBid && (
              <div>
                <div className="text-xs text-muted-foreground">المدة المقدّرة</div>
                <div className="mt-0.5 text-lg font-bold num">
                  {acceptedBid.estimatedDays} {acceptedBid.estimatedDays === 1 ? 'يوم' : 'أيام'}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Compact sidebar provider card (sidebar only) ────────────────────
// Shows a condensed provider summary in the right sidebar once the order
// has been assigned. The full ProviderInfoCard in the main column stays.

function SidebarProviderCard({ order }: { order: Order }) {
  const apiOrder = order as ApiOrderFull;
  const provider = apiOrder.provider ?? companyById(order.carrierId);
  if (!provider) return null;

  type ApiBid = { id: string; status: string; price?: number; amount?: number; estimatedDays?: number };
  const apiBids = (order as Order & { bids?: ApiBid[] }).bids;
  const acceptedBid = apiBids?.find((b) => b.status === 'ACCEPTED') ?? BIDS.find((b) => b.orderId === order.id && b.status === 'ACCEPTED');

  const initials = (provider.nameAr ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('');

  return (
    <Card className="border-success/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">المزوّد المُعتمد</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Provider header */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{provider.nameAr}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
              {provider.rating && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span className="num">{provider.rating.toFixed(1)}</span>
                  {(provider as { completedTrips?: number }).completedTrips != null && (
                    <span>({(provider as { completedTrips?: number }).completedTrips} طلب)</span>
                  )}
                </span>
              )}
              {provider.city && <span>· {provider.city}</span>}
            </div>
          </div>
        </div>

        {/* Contact button */}
        {(provider as { contactPhone?: string }).contactPhone && (
          <Button size="sm" variant="outline" className="w-full" asChild>
            <a href={`tel:${(provider as { contactPhone?: string }).contactPhone}`}>
              <Phone className="h-3.5 w-3.5" /> اتصال بالمزوّد
            </a>
          </Button>
        )}

        {/* Agreed price + duration */}
        {(order.agreedPrice || acceptedBid) && (
          <div className="pt-3 border-t grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">السعر</div>
              <div className="font-bold mt-0.5">
                <Currency amount={order.agreedPrice ?? acceptedBid?.price ?? 0} />
              </div>
            </div>
            {acceptedBid?.estimatedDays && (
              <div>
                <div className="text-xs text-muted-foreground">المدة</div>
                <div className="font-bold num mt-0.5">
                  {acceptedBid.estimatedDays} {acceptedBid.estimatedDays === 1 ? 'يوم' : 'أيام'}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── DIRECT proposal view (client side) ──────────────────────────────
//
// Shown when mode=DIRECT and the order hasn't been assigned yet. Three
// states depending on the proposal:
//   1. No proposal yet           → "بانتظار رد الناقل"
//   2. Carrier proposed a price  → big price card + 3 actions
//   3. Negotiation finalised     → success or rejection state

function DirectProposalView({ order, onRefetch }: { order: Order; onRefetch: () => void }) {
  const proposal = proposalForOrder(order.id);
  const provider = companyById(order.targetCarrierId);
  const [action, setAction] = useState<null | 'ACCEPT' | 'COUNTER' | 'REJECT'>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterNote, setCounterNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // pendingBid — the carrier's latest offer from the real API (order.bids injected by normalizeOrder)
  const bidsFromApi = (order as Order & { bids?: { id: string; status: string; price?: number; amount?: number }[] }).bids;
  const pendingBid = bidsFromApi?.find((b) => b.status === 'PENDING');

  // 1) Still waiting for the very first carrier reply
  if (!proposal && !pendingBid) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-warning/15 text-warning mx-auto grid place-items-center mb-4 animate-pulse">
            <UserSearch className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-lg">بانتظار رد المزوّد</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            أُرسل الطلب مباشرة إلى <strong>{provider?.nameAr}</strong>. سيتم إخطارك فور الرد بالقبول أو السعر.
          </p>
        </CardContent>
      </Card>
    );
  }

  const onTable = proposal ? lastRound(proposal) : undefined;
  const isClientTurn = proposal?.status === 'AWAITING_CLIENT' || !!pendingBid;
  const activeBidId = pendingBid?.id;
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (action === 'ACCEPT' && activeBidId) {
        await api.post(`/orders/${order.id}/bids/${activeBidId}/accept`, {});
        notify.success('تم قبول السعر', `الطلب أُسند لـ ${provider?.nameAr ?? 'المزوّد'}`);
        onRefetch();
      } else if (action === 'COUNTER') {
        await api.post(`/orders/${order.id}/bids`, {
          amount: counterPrice,
          notes: counterNote || undefined,
        });
        notify.success('تم إرسال سعرك المقابل', `${counterPrice.toLocaleString('en-US')} ر.س — بانتظار رد المزوّد`);
        onRefetch();
      } else if (action === 'REJECT' && activeBidId) {
        await api.post(`/orders/${order.id}/bids/${activeBidId}/reject`, {});
        notify.success('تم رفض العرض', 'يمكنك اختيار مزوّد آخر أو تحويل الطلب للسوق المفتوح');
        onRefetch();
      }
      setAction(null);
    } catch (err) {
      notify.error(err, 'فشل تنفيذ الإجراء');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className={isClientTurn ? 'border-warning/40 bg-warning/[0.04]' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardDescription className="mb-1">
                {isClientTurn ? `🟡 سعر مقترَح من ${provider?.nameAr}` : `بانتظار رد ${provider?.nameAr}`}
              </CardDescription>
              {onTable && (
                <>
                  <CardTitle className="text-3xl"><Currency amount={onTable.price} /></CardTitle>
                  {onTable.days && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      مدة التنفيذ: <span className="font-medium num">{onTable.days}</span> أيام
                    </div>
                  )}
                </>
              )}
            </div>
            {onTable && (
              <div className="text-xs text-muted-foreground text-end">
                <div>منذ {formatRelative(onTable.at)}</div>
                <div className="mt-0.5">{formatDate(onTable.at, 'd MMM · HH:mm')}</div>
              </div>
            )}
          </div>
        </CardHeader>
        {onTable?.notes && (
          <CardContent>
            <div className="rounded-md bg-card border p-3 text-sm flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="leading-relaxed">{onTable.notes}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Actions — only when it's the client's turn */}
      {isClientTurn && (
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات المتاحة</CardTitle>
            <CardDescription>اختر ما يناسبك — يصل ردّك للمزوّد فوراً</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ProposalAction
              icon={CheckCircle2}
              title="قبول السعر"
              subtitle={`الإسناد لـ ${provider?.nameAr} مباشرة`}
              tone="success"
              onClick={() => setAction('ACCEPT')}
            />
            <ProposalAction
              icon={MessageSquare}
              title="اقتراح سعر مقابل"
              subtitle="إرسال سعرك للمزوّد"
              tone="warning"
              onClick={() => {
                setAction('COUNTER');
                setCounterPrice(onTable ? Math.round(onTable.price * 0.93) : 0);
              }}
            />
            <ProposalAction
              icon={X}
              title="رفض العرض"
              subtitle="اختيار مزوّد آخر"
              tone="destructive"
              onClick={() => setAction('REJECT')}
            />
          </CardContent>
        </Card>
      )}

      {proposal?.status === 'AWAITING_CARRIER_REPLY' && (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-info/15 text-info mx-auto grid place-items-center mb-3 animate-pulse">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">سعرك المقابل أُرسل للمزوّد</p>
            <p className="mt-1 text-xs text-muted-foreground">بانتظار قبوله، رفضه، أو سعر مقابل آخر</p>
          </CardContent>
        </Card>
      )}

      {proposal?.status === 'ACCEPTED' && (
        <Card className="border-success/30 bg-success/[0.04]">
          <CardContent className="pt-6 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-success">تم الاتفاق ✓</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                انتقل الطلب لـ ASSIGNED مع <strong>{provider?.nameAr}</strong>. سيُجهَّز للاستلام في الموعد المتّفق.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {proposal?.status === 'DECLINED' && (
        <Card className="border-destructive/30 bg-destructive/[0.04]">
          <CardContent className="pt-6 flex items-start gap-3">
            <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">انتهى التفاوض</h3>
              <p className="mt-1 text-sm text-muted-foreground">يمكنك اختيار مزوّد آخر أو تحويل الطلب للسوق المفتوح.</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline">اختيار مزوّد آخر</Button>
                <Button size="sm">تحويل للسوق المفتوح</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negotiation history (collapsible-ish — always visible since it's short) */}
      {(proposal?.rounds?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">سجل التفاوض</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {proposal?.rounds?.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 text-xs font-bold ${
                    r.by === 'CLIENT' ? 'bg-primary/10 text-primary' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {r.by === 'CLIENT' ? 'أنا' : 'ن'}
                  </div>
                  <div className="flex-1 min-w-0 rounded-md border bg-card p-3">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold">
                        {r.by === 'CLIENT' ? 'أنت' : provider?.nameAr} — {r.kind === 'COUNTER' ? 'اقترح' : r.kind === 'ACCEPT' ? 'قبل' : 'رفض'}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatRelative(r.at)}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold"><Currency amount={r.price} /></span>
                      {r.days && <span className="text-xs text-muted-foreground">· {r.days} أيام</span>}
                    </div>
                    {r.notes && <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{r.notes}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={action === 'ACCEPT'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>قبول العرض</DialogTitle>
            <DialogDescription>
              سيُسند الطلب لـ <strong>{provider?.nameAr}</strong> بسعر{' '}
              <strong><Currency amount={onTable?.price ?? 0} /></strong> ويُحجَز المبلغ في Escrow.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>إلغاء</Button>
            <Button onClick={submit}><CheckCircle2 className="h-4 w-4" /> تأكيد القبول</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action === 'COUNTER'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اقتراح سعر مقابل</DialogTitle>
            <DialogDescription>سيراجعه المزوّد ويختار: قبول، اعتذار، أو سعر آخر</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>سعرك المقترح (ر.س)</Label>
              <Input type="number" value={counterPrice || ''} onChange={(e) => setCounterPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>ملاحظة للمزوّد (اختياري)</Label>
              <textarea
                rows={3}
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                className="w-full p-3 rounded-md border bg-background text-sm"
                placeholder="مثال: السعر أعلى من ميزانيتنا، نأمل تخفيضاً"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>إلغاء</Button>
            <Button onClick={submit} disabled={!counterPrice}>إرسال السعر</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action === 'REJECT'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض العرض</DialogTitle>
            <DialogDescription>سيُعلَم المزوّد وستتمكّن من اختيار مزوّد آخر أو تحويل الطلب للسوق المفتوح</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>تراجع</Button>
            <Button variant="destructive" onClick={submit}><X className="h-4 w-4" /> تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProposalAction({
  icon: Icon, title, subtitle, tone, onClick,
}: {
  icon: any; title: string; subtitle: string;
  tone: 'success' | 'warning' | 'destructive';
  onClick: () => void;
}) {
  const styles = {
    success:     { ring: 'hover:border-success/40',     bg: 'bg-success/15 text-success' },
    warning:     { ring: 'hover:border-warning/40',     bg: 'bg-warning/15 text-warning' },
    destructive: { ring: 'hover:border-destructive/40', bg: 'bg-destructive/15 text-destructive' },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-start transition-colors ${styles.ring}`}
    >
      <div className={`h-10 w-10 rounded-lg grid place-items-center ${styles.bg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </button>
  );
}
