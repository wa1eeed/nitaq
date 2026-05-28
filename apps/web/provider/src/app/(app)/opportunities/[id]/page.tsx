'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { useAuthStore } from '@/lib/auth-store';
import {
  ArrowRight, Briefcase, Building2, Calendar, CheckCircle2, Clock, History, MapPin, MessageSquare, Navigation, Package,
  Send, ShieldCheck, UserSearch, X,
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import {
  ORDERS, TRUCKS, companyById, formatDate, formatDateTime, formatRelative, lastRound, proposalForOrder,
  pickupWindowLabel, normalizeOrder,
  CURRENT_CARRIER_ID,
  type DirectProposal,
} from '@naqla/shared-utils';

const TRUCK_LABELS: Record<string, string> = {
  CONSULTING: 'استشارات', DESIGN: 'تصميم', INSTALLATION: 'تركيب وتنصيب',
  MAINTENANCE: 'صيانة', TECHNICAL_SUPPORT: 'دعم تقني', TRAINING: 'تدريب',
  IT_SERVICES: 'خدمات تقنية', LOGISTICS: 'لوجستيات',
  PROJECT_MANAGEMENT: 'إدارة مشاريع', OTHER: 'أخرى',
};

export default function CarrierOpportunityDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // Real-API source of truth, with mock fallback (see api.ts interceptor).
  // normalizeOrder aliases Prisma fields (weight, requiredTruckType) to the
  // mock shape (weightKg, truckType) the UI accesses directly.
  const { data: orderData, mutate: refetchOrder } = useSWR<typeof ORDERS[number]>(
    params?.id ? `/orders/${params.id}` : null,
    fetcher,
  );
  const order = normalizeOrder(orderData) ?? ORDERS.find((o) => o.id === params.id);

  // Detect whether THIS carrier has already submitted a bid on this order.
  // Prefer the real companyId from the JWT (auth-store); fall back to the
  // dev-mock CURRENT_CARRIER_ID so the demo mode still highlights the bid.
  const authedCompanyId = useAuthStore((s) => s.user?.companyId);
  const myCompanyId = authedCompanyId ?? CURRENT_CARRIER_ID;
  type BidLike = {
    id: string;
    carrierId?: string;
    providerId?: string;
    amount?: number;
    price?: number;
    status: string;
    estimatedDays?: number;
    proposedPickupDate?: string;
    proposedDeliveryDate?: string;
    notes?: string;
    createdAt?: string;
  };
  const myBid: BidLike | null = (() => {
    if (!order) return null;
    const bids = (order as unknown as { bids?: BidLike[] }).bids;
    if (!Array.isArray(bids)) return null;
    return bids.find((b) => (b.carrierId ?? b.providerId) === myCompanyId) ?? null;
  })();

  const [price, setPrice] = useState<number>(0);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Concrete proposed delivery date — replaces the older "days + hours"
  // duration fields. Required by the form so the client sees a real date
  // instead of doing mental math.
  const [proposedDeliveryDate, setProposedDeliveryDate] = useState<string>('');
  const [truckId, setTruckId] = useState<string>(TRUCKS[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  // Carrier can re-bid after rejection: clicking the retry button flips this
  // flag so the rejected-bid card hides and the submission form shows. The
  // backend allows upsert from REJECTED → PENDING.
  const [retrying, setRetrying] = useState(false);

  // If order is already in active execution phase, redirect to orders page
  const activeStatuses = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];

  if (!order) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">الفرصة غير موجودة</h3>
          <Button onClick={() => router.push('/opportunities')} className="mt-4">عودة</Button>
        </CardContent>
      </Card>
    );
  }

  const client = companyById(order.clientId);
  const commission = Math.round(price * 0.08);
  const vat = Math.round(commission * 0.15);
  const net = price - commission - vat;

  if (activeStatuses.includes(order.status) && (!myBid || myBid.status === 'ACCEPTED')) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
          <h3 className="font-semibold text-lg">تم قبول عرضك — الطلب قيد التنفيذ</h3>
          <p className="text-sm text-muted-foreground">يمكنك متابعة الطلب وإدارة مراحل التنفيذ من صفحة الطلبات</p>
          <Button onClick={() => router.push(`/orders/${order.id}`)}>
            <Navigation className="h-4 w-4" />
            الانتقال لتفاصيل الطلب والتحكم بالتنفيذ
          </Button>
        </CardContent>
      </Card>
    );
  }

  // DIRECT orders use a private negotiation flow with 3 actions instead of
  // the open-market bid form. Branch on mode and render a different page.
  if (order.mode === 'DIRECT') {
    const proposal = proposalForOrder(order.id);
    return (
      <DirectNegotiationView
        order={order}
        client={client}
        proposal={proposal}
        onBack={() => router.push('/opportunities')}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`${order.originCity} ← ${order.destinationCity}`}
        subtitle={`فرصة · ${order.orderNumber}`}
        actions={
          <>
            <StatusBadge status={order.status} />
            <Button variant="outline" onClick={() => router.push('/opportunities')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* If this carrier already submitted a bid, show its status + values
            instead of the submission form (otherwise the form looks like a
            fresh prompt to bid, which is confusing once you've already bid). */}
        {myBid && !retrying ? (
          <Card className="lg:col-span-2 border-info/40 bg-info/[0.03]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-5 w-5 text-info" />
                    <CardTitle>عرضك على هذا الطلب</CardTitle>
                  </div>
                  <CardDescription>
                    {myBid.status === 'PENDING' && 'بانتظار قرار العميل — لا حاجة لإعادة التقديم'}
                    {myBid.status === 'ACCEPTED' && '✅ تم قبول عرضك — الطلب الآن قيد التنفيذ'}
                    {myBid.status === 'REJECTED' && '❌ لم يُختر عرضك على هذا الطلب'}
                    {myBid.status === 'WITHDRAWN' && 'تم سحب عرضك'}
                    {myBid.status === 'EXPIRED' && 'انتهت صلاحية العرض'}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    myBid.status === 'ACCEPTED' ? 'success'
                    : myBid.status === 'REJECTED' ? 'destructive'
                    : myBid.status === 'PENDING' ? 'warning'
                    : 'outline'
                  }
                >
                  {myBid.status === 'PENDING'   && 'بانتظار الرد'}
                  {myBid.status === 'ACCEPTED'  && 'مقبول ✓'}
                  {myBid.status === 'REJECTED'  && 'مرفوض'}
                  {myBid.status === 'WITHDRAWN' && 'مسحوب'}
                  {myBid.status === 'EXPIRED'   && 'منتهي'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <div className="text-xs text-muted-foreground">السعر</div>
                  <div className="mt-0.5 text-lg font-bold num">
                    {((myBid.amount ?? myBid.price ?? 0)).toLocaleString('en-US')}
                    <span className="ms-1 text-xs text-muted-foreground">ر.س</span>
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <div className="text-xs text-muted-foreground">موعد الإنجاز المقترح</div>
                  <div className="mt-0.5 text-sm font-medium">
                    {myBid.proposedDeliveryDate
                      ? formatDate(myBid.proposedDeliveryDate, 'EEEE d MMM')
                      : '—'}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <div className="text-xs text-muted-foreground">تاريخ التقديم</div>
                  <div className="mt-0.5 text-sm font-medium">
                    {myBid.createdAt ? formatRelative(myBid.createdAt) : '—'}
                  </div>
                </div>
              </div>
              {myBid.notes && (
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="text-xs text-muted-foreground mb-1">ملاحظتك</div>
                  {myBid.notes}
                </div>
              )}
              {myBid.status === 'ACCEPTED' && (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <Navigation className="h-4 w-4" />
                  عرض تفاصيل الطلب والبدء بالتنفيذ
                </Button>
              )}
              {myBid.status === 'PENDING' && (
                <div className="rounded-md bg-info/10 border border-info/30 p-3 flex items-start justify-between gap-3 flex-wrap text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                    <p className="text-muted-foreground leading-relaxed">
                      سيظهر هذا الطلب في تبويب <strong>"بانتظار موافقة العميل"</strong> حتى يقرّر العميل.
                    </p>
                  </div>
                  <WithdrawBidButton
                    orderId={order.id}
                    bidId={myBid.id}
                    onSuccess={() => refetchOrder()}
                  />
                </div>
              )}
              {myBid.status === 'REJECTED' && ['PUBLISHED', 'BIDDING'].includes(order.status) && (
                <div className="rounded-md bg-destructive/5 border border-destructive/30 p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-2">
                    <Send className="h-4 w-4 text-destructive shrink-0 mt-1" />
                    <div className="text-sm">
                      <div className="font-semibold">باب العروض ما زال مفتوحاً</div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        يمكنك تقديم عرض جديد بسعر أو شروط أفضل — قد يعيد العميل النظر.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      // Pre-fill the form with the rejected bid's values so the
                      // carrier can iterate (lower price / earlier delivery) instead
                      // of starting from scratch.
                      setPrice(myBid.amount ?? myBid.price ?? 0);
                      setProposedDeliveryDate(
                        myBid.proposedDeliveryDate
                          ? new Date(myBid.proposedDeliveryDate).toISOString().slice(0, 10)
                          : '',
                      );
                      setNotes(myBid.notes ?? '');
                      setRetrying(true);
                    }}
                  >
                    <Send className="h-4 w-4" />
                    إعادة تقديم
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{retrying ? 'إعادة تقديم' : 'قدّم عرضك'}</CardTitle>
            <CardDescription>
              {retrying
                ? 'حاول بسعر أو شروط أفضل — تم تعبئة الحقول من عرضك السابق المرفوض'
                : 'اقترح سعرك التنافسي — العميل سيقارن العروض ويختار الأنسب'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {retrying && myBid && (
              <div className="rounded-md bg-destructive/5 border border-destructive/30 p-3 text-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <History className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">عرضك السابق المرفوض:</span>{' '}
                    <span className="num">{(myBid.amount ?? myBid.price ?? 0).toLocaleString('en-US')}</span> ر.س
                    {myBid.proposedDeliveryDate && (
                      <> · تسليم {formatDate(myBid.proposedDeliveryDate, 'd MMM')}</>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRetrying(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  إلغاء
                </button>
              </div>
            )}
            {/* Price field is the single most-decided value in a bid — make it
                visually dominant: bigger, highlighted border, larger font. */}
            <div className="rounded-xl border-2 border-primary/40 bg-primary/[0.04] p-4 space-y-2">
              <Label htmlFor="price" className="text-sm font-semibold">سعرك المقترح (ر.س.)</Label>
              <Input
                id="price"
                type="number"
                inputMode="numeric"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="0"
                className="h-14 text-3xl font-bold tracking-tight num bg-background"
                autoFocus
              />
              {price > 0 && (
                <div className="text-xs text-muted-foreground">
                  بعد العمولة + الضريبة:{' '}
                  <span className="font-semibold text-success num">
                    {net.toLocaleString('en-US')} ر.س
                  </span>{' '}
                  ستُحوَّل لمحفظتك
                </div>
              )}
            </div>
            {/* Pickup date — set by the client, read-only for providers */}
            <div className="rounded-lg border bg-info/[0.04] border-info/30 p-4 flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-info shrink-0" />
              <span className="text-muted-foreground">
                موعد البدء المطلوب من العميل:{' '}
                <span className="font-medium text-foreground">
                  {formatDate(order.pickupDate, 'EEEE d MMM')}
                  {order.pickupWindow && ` · ${pickupWindowLabel(order.pickupWindow)}`}
                </span>
              </span>
            </div>

            {/* Proposed delivery date — concrete date instead of "days + hours" math.
                Must be on or after the effective pickup date. */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <Label htmlFor="proposedDeliveryDate" className="text-xs font-semibold text-muted-foreground uppercase">
                موعد الإنجاز المقترح
              </Label>
              <Input
                id="proposedDeliveryDate"
                type="date"
                min={order.pickupDate ? new Date(order.pickupDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                value={proposedDeliveryDate}
                onChange={(e) => setProposedDeliveryDate(e.target.value)}
              />
              {proposedDeliveryDate && (
                <div className="text-xs text-muted-foreground">
                  سيظهر للعميل: 📦 الإنجاز{' '}
                  <span className="font-medium num" dir="ltr">
                    {formatDate(proposedDeliveryDate, 'EEEE d MMM')}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>الخدمة المخصّصة</Label>
              <Select value={truckId} onValueChange={setTruckId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRUCKS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.plateNumber} · {TRUCK_LABELS[t.truckType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات للعميل (اختياري)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: خدمة متخصصة مع ضمان الجودة، خبرة 5 سنوات."
              />
            </div>

            <div className="rounded-lg bg-muted/40 p-4 space-y-2 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                صافي ما ستستلمه (تقديري)
              </div>
              <BreakdownRow label="سعر العرض" amount={price} />
              <BreakdownRow label="عمولة المنصة (8%)" amount={-commission} />
              <BreakdownRow label="ضريبة (15% على العمولة)" amount={-vat} />
              <Separator />
              <div className="flex items-center justify-between pt-1">
                <span className="font-medium">الصافي إلى حسابك</span>
                <div className="text-lg font-bold num">{net.toLocaleString('en-US')} <span className="text-xs text-muted-foreground">ر.س.</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => router.back()}>إلغاء</Button>
              <Button
                onClick={async () => {
                  if (!order) return;
                  setSubmitErr(null);
                  setSubmitting(true);
                  try {
                    // Backend bid endpoint: POST /api/orders/:orderId/bids
                    // v0.8.x replaced estimatedDays/Hours with a concrete
                    // proposedDeliveryDate. estimatedDays defaults to 0 in
                    // the DTO so we don't need to send it.
                    await api.post(`/orders/${order.id}/bids`, {
                      amount: price,
                      proposedDeliveryDate: proposedDeliveryDate || undefined,
                      notes: notes || undefined,
                    });
                    // Re-fetch so the page swaps to the "my bid" view immediately
                    // (instead of going back to /opportunities and losing context).
                    await refetchOrder();
                    // Exit retry mode so the new PENDING bid card shows.
                    setRetrying(false);
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    setSubmitErr(`فشل إرسال العرض: ${msg}`);
                  } finally {
                    // Always release the button, whether success or error —
                    // otherwise it stays stuck on "جاري الإرسال" forever.
                    setSubmitting(false);
                  }
                }}
                disabled={!price || !proposedDeliveryDate || !truckId || submitting}
              >
                <Send className="h-4 w-4" />
                {submitting ? 'جاري الإرسال...' : 'إرسال العرض'}
              </Button>
            </div>
            {submitErr && (
              <div className="mt-3 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                {submitErr}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        <div className="space-y-6">
          {client && (
            <Card>
              <CardHeader><CardTitle>العميل</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{(client.nameAr ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{client.nameAr}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {client.city}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>تفاصيل الطلب</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="نوع الخدمة" icon={Package} value={order.cargoType} />
                <Row label="نوع المورد" icon={Briefcase} value={(order.truckType && TRUCK_LABELS[order.truckType]) || order.truckType || '—'} />
                {order.requiresInsurance && <Row label="تأمين" icon={ShieldCheck} value="مطلوب" />}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الموقع والموعد</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="المدينة" icon={MapPin} value={order.originCity} />
                <Row label="تاريخ البدء" icon={Calendar} value={formatDate(order.pickupDate, 'EEEE d MMM · HH:mm')} />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function BreakdownRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`num font-medium ${amount < 0 ? 'text-destructive' : ''}`}>
        {amount < 0 ? '- ' : '+ '}{Math.abs(amount).toLocaleString('en-US')} ر.س.
      </span>
    </div>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-sm font-medium text-end max-w-[60%]">{value ?? '—'}</dd>
    </div>
  );
}

// ─── DIRECT negotiation view (carrier side) ───────────────────────────
//
// Three top-level actions:
//   1. ACCEPT — open dialog → enter price → "تأكيد القبول بهذا السعر"
//   2. COUNTER — open dialog → propose a different price + note
//   3. DECLINE — open dialog → optional reason → end the negotiation
//
// When the client has already countered, the carrier sees their counter at
// the top with the same 3 actions (accept it / counter again / decline).

function DirectNegotiationView({
  order, client, proposal, onBack,
}: {
  order: any;
  client: ReturnType<typeof companyById>;
  proposal: DirectProposal | undefined;
  onBack: () => void;
}) {
  const [action, setAction] = useState<null | 'ACCEPT' | 'COUNTER' | 'DECLINE'>(null);
  const [price, setPrice] = useState<number>(0);
  const [days, setDays] = useState<number>(2);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  const lastClientRound = proposal?.rounds.filter((r) => r.by === 'CLIENT').slice(-1)[0];
  const onTable = lastRound(proposal!);                  // most recent round (any side)
  const isClientTurn = proposal?.status === 'AWAITING_CLIENT';
  const isCarrierTurn = !proposal || proposal.status === 'AWAITING_CARRIER' || proposal.status === 'AWAITING_CARRIER_REPLY';

  // Pre-fill price if client has countered (so carrier sees what to react to)
  const openCounter = () => {
    setAction('COUNTER');
    setPrice(lastClientRound?.price ? Math.round(lastClientRound.price * 0.95) : 0);
    setDays(lastClientRound?.days ?? 2);
    setNotes('');
  };

  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (action === 'ACCEPT' || action === 'COUNTER') {
        // Both ACCEPT and COUNTER map to creating a bid on the order. ACCEPT
        // takes the client's `onTable` price as-is; COUNTER sets a different
        // price. Client still has to formally accept on their side.
        await api.post(`/orders/${order.id}/bids`, {
          amount: price,
          notes: notes || undefined,
        });
        notify.success(
          action === 'ACCEPT' ? 'تم قبول السعر — بانتظار توقيع العميل' : 'تم إرسال سعرك المقابل',
          `${price.toLocaleString('en-US')} ر.س`,
        );
      } else if (action === 'DECLINE') {
        // POST /orders/:id/decline-direct → resets order to PUBLISHED so client can reassign
        await api.post(`/orders/${order.id}/decline-direct`, { reason: reason || undefined });
        notify.success('تم إرسال اعتذارك', 'سيتمكّن العميل من اختيار مزوّد آخر');
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
      <PageHeader
        title={`طلب مباشر · ${order.originCity}`}
        subtitle={`${order.orderNumber} · من ${client?.nameAr ?? '—'}`}
        actions={
          <>
            <Badge variant="warning" className="gap-1">
              <UserSearch className="h-3 w-3" /> موجّه لشركتك حصرياً
            </Badge>
            <Button variant="outline" onClick={onBack}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN: negotiation card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top: what's currently "on the table" */}
          {onTable && isCarrierTurn ? (
            <Card className="border-warning/40 bg-warning/[0.04]">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription className="mb-1">سعر مقترَح من العميل</CardDescription>
                    <CardTitle className="text-3xl"><Currency amount={onTable.price} /></CardTitle>
                    {onTable.days && (
                      <div className="text-sm text-muted-foreground mt-1">
                        مدة التنفيذ المقترحة: <span className="font-medium num">{onTable.days}</span> أيام
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-end">
                    منذ {formatRelative(onTable.at)}
                  </div>
                </div>
              </CardHeader>
              {onTable.notes && (
                <CardContent>
                  <div className="rounded-md bg-card border p-3 text-sm flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{onTable.notes}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ) : !proposal ? (
            <Card className="border-info/30 bg-info/[0.03]">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-info/15 text-info grid place-items-center shrink-0">
                    <UserSearch className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">طلب مباشر جديد من {client?.nameAr ?? 'العميل'}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      لم يحدّد العميل سعراً. كمزوّد مُرسَل إليه الطلب مباشرة، يمكنك:
                      اقتراح سعر، أو الاعتذار. لن تظهر هذه الفرصة لأي مزوّد آخر.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Three action cards */}
          {isCarrierTurn && (
            <Card>
              <CardHeader>
                <CardTitle>الإجراءات المتاحة</CardTitle>
                <CardDescription>اختر ما يناسبك — يصل ردّك للعميل فوراً</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ActionTile
                  icon={CheckCircle2}
                  title={onTable ? 'قبول السعر' : 'قبول الطلب'}
                  subtitle={onTable ? `قبول ${onTable.price.toLocaleString('en-US')} ر.س` : 'اقتراح سعر للطلب'}
                  tone="success"
                  onClick={() => {
                    setAction('ACCEPT');
                    setPrice(onTable?.price ?? 0);
                    setDays(onTable?.days ?? 2);
                  }}
                />
                <ActionTile
                  icon={Send}
                  title="سعر مقابل"
                  subtitle="اقتراح سعر مختلف"
                  tone="warning"
                  onClick={openCounter}
                />
                <ActionTile
                  icon={X}
                  title="اعتذار عن الطلب"
                  subtitle="إنهاء التفاوض"
                  tone="destructive"
                  onClick={() => setAction('DECLINE')}
                />
              </CardContent>
            </Card>
          )}

          {/* If it's the client's turn, show a waiting state */}
          {isClientTurn && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-info/15 text-info mx-auto grid place-items-center mb-3 animate-pulse">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <h3 className="font-semibold">عرضك أُرسل للعميل</h3>
                <p className="mt-1 text-sm text-muted-foreground">سيرد العميل بالقبول، الرفض، أو سعر مقابل</p>
              </CardContent>
            </Card>
          )}

          {proposal?.status === 'ACCEPTED' && (
            <Card className="border-success/30 bg-success/[0.04]">
              <CardContent className="pt-6 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-success">تم الاتفاق ✓</h3>
                  <p className="mt-1 text-sm text-muted-foreground">انتقل الطلب لـ ASSIGNED — يمكنك متابعته من قسم "طلباتي".</p>
                </div>
              </CardContent>
            </Card>
          )}
          {proposal?.status === 'DECLINED' && (
            <Card className="border-destructive/30 bg-destructive/[0.04]">
              <CardContent className="pt-6 flex items-start gap-3">
                <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive">انتهى التفاوض</h3>
                  <p className="mt-1 text-sm text-muted-foreground">العميل قد يختار مزوّداً آخر أو يحوّل الطلب للسوق المفتوح.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Negotiation history */}
          {proposal && proposal.rounds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" /> سجل التفاوض
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {proposal.rounds.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 text-xs font-bold ${
                        r.by === 'CARRIER' ? 'bg-primary/10 text-primary' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}>
                        {r.by === 'CARRIER' ? 'ن' : 'ع'}
                      </div>
                      <div className="flex-1 min-w-0 rounded-md border bg-card p-3">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold">
                            {r.by === 'CARRIER' ? 'أنت (المزوّد)' : 'العميل'} —{' '}
                            {r.kind === 'COUNTER' ? 'اقترح' : r.kind === 'ACCEPT' ? 'قبل' : 'رفض'}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(r.at)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold num"><Currency amount={r.price} /></span>
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
        </div>

        {/* SIDE: order details */}
        <div className="space-y-6">
          {client && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> العميل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>{(client.nameAr ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{client.nameAr}</div>
                    <div className="text-xs text-muted-foreground">{client.city}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">تفاصيل الطلب</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="رقم الطلب" value={<span className="font-mono text-xs">{order.orderNumber}</span>} />
                <Row label="نوع الخدمة" icon={Package} value={order.cargoType} />
                <Row label="الوصف" value={order.cargoDescription} />
                <Row label="نوع المورد" icon={Briefcase} value={order.truckType} />
                <Row label="تاريخ البدء" icon={Calendar} value={formatDate(order.pickupDate, 'EEEE d MMM · HH:mm')} />
                <Row label="المدينة" icon={MapPin} value={order.originCity} />
                {order.requiresInsurance && <Row label="تأمين" icon={ShieldCheck} value="مطلوب" />}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Action dialogs ─── */}
      <Dialog open={action === 'ACCEPT'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>قبول الطلب وتسعيره</DialogTitle>
            <DialogDescription>
              {onTable
                ? `سيتم قبول السعر المقترَح من العميل (${onTable.price.toLocaleString('en-US')} ر.س)`
                : 'اقترح السعر النهائي — في حال موافقة العميل ينتقل الطلب لـ ASSIGNED مباشرة'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>السعر النهائي (ر.س)</Label>
                <Input type="number" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} disabled={!!onTable} />
              </div>
              <div className="space-y-2">
                <Label>مدة التنفيذ (أيام)</Label>
                <Input type="number" value={days || ''} onChange={(e) => setDays(Number(e.target.value))} />
              </div>
            </div>
            {(() => {
              const c = Math.round(price * 0.08);
              const v = Math.round(c * 0.15);
              const n = price - c - v;
              return (
                <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span>السعر</span><span className="num">{price.toLocaleString('en-US')} ر.س</span></div>
                  <div className="flex justify-between text-destructive"><span>عمولة 8%</span><span>−<span className="num">{c.toLocaleString('en-US')}</span></span></div>
                  <div className="flex justify-between text-destructive"><span>ضريبة على العمولة 15%</span><span>−<span className="num">{v.toLocaleString('en-US')}</span></span></div>
                  <div className="flex justify-between pt-1 border-t font-semibold"><span>صافي مستحقّك</span><span className="num text-success">{n.toLocaleString('en-US')} ر.س</span></div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>إلغاء</Button>
            <Button onClick={submit} disabled={!price || !days}><CheckCircle2 className="h-4 w-4" /> تأكيد القبول</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action === 'COUNTER'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اقتراح سعر مقابل</DialogTitle>
            <DialogDescription>سيراجعه العميل ويختار: قبول، رفض، أو اقتراح بسعر آخر</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>السعر المقترح</Label>
                <Input type="number" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>مدة التنفيذ (أيام)</Label>
                <Input type="number" value={days || ''} onChange={(e) => setDays(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظة للعميل (اختياري)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: السعر يشمل تأمين شامل + GPS لحظي" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>إلغاء</Button>
            <Button onClick={submit} disabled={!price}><Send className="h-4 w-4" /> إرسال السعر</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action === 'DECLINE'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الاعتذار عن الطلب</DialogTitle>
            <DialogDescription>سيتم إعلام العميل ليختار مزوّداً آخر أو يحوّل الطلب للسوق المفتوح</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>السبب (اختياري — يساعد العميل في فهم القرار)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="مثال: مواردنا مشغولة في الموعد المطلوب" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>تراجع</Button>
            <Button variant="destructive" onClick={submit}><X className="h-4 w-4" /> تأكيد الاعتذار</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WithdrawBidButton({ orderId, bidId, onSuccess }: { orderId: string; bidId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const withdraw = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/bids/${bidId}/withdraw`, {});
      notify.success('تم سحب عرضك');
      onSuccess();
    } catch (err) {
      notify.error(err, 'فشل سحب العرض');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0" onClick={withdraw} disabled={loading}>
      <X className="h-3 w-3" />
      {loading ? 'جارٍ السحب…' : 'سحب العرض'}
    </Button>
  );
}

function ActionTile({ icon: Icon, title, subtitle, tone, onClick }: {
  icon: any; title: string; subtitle: string;
  tone: 'success' | 'warning' | 'destructive';
  onClick: () => void;
}) {
  const styles = {
    success:     { ring: 'hover:border-success/40',     icon: 'bg-success/15 text-success' },
    warning:     { ring: 'hover:border-warning/40',     icon: 'bg-warning/15 text-warning' },
    destructive: { ring: 'hover:border-destructive/40', icon: 'bg-destructive/15 text-destructive' },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-start transition-colors ${styles.ring}`}
    >
      <div className={`h-10 w-10 rounded-lg grid place-items-center ${styles.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </button>
  );
}
