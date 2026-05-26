'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight, Building2, CheckCircle2, Mail, MapPin, Navigation, Package,
  Phone, Shield, ShieldCheck, Truck, Users, X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { playSoundIfEnabled } from '@/lib/sound';
import useSWR from 'swr';
import { api, fetcher } from '@/lib/api';
import { notify } from '@/lib/notify';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import { EscrowCountdown } from '@/components/escrow-countdown';
import {
  ORDERS, companyById, formatDate, formatDateTime, timelineFor, normalizeOrder,
} from '@naqla/shared-utils';

const TITLES: Record<string, string> = {
  CREATED: 'إنشاء الطلب', PUBLISHED: 'نشر الطلب', BID_ACCEPTED: 'قبول عرضك',
  CONFIRMED: 'تأكيد البدء', PICKED_UP: 'تم الاستلام', IN_TRANSIT: 'قيد التنفيذ',
  DELIVERED: 'تم التسليم', PAYMENT_RELEASED: 'الإفراج عن المبلغ',
  COMPLETED: 'إغلاق الطلب', CANCELLED: 'إلغاء',
};

export default function CarrierOrderDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: orderData, mutate: refetchOrder } = useSWR<typeof ORDERS[number]>(
    params?.id ? `/orders/${params.id}` : null,
    fetcher,
  );
  const order = normalizeOrder(orderData) ?? ORDERS.find((o) => o.id === params.id);
  const [confirmPickupOpen, setConfirmPickupOpen] = useState(false);
  const [startTripOpen, setStartTripOpen] = useState(false);
  const [markDeliveredOpen, setMarkDeliveredOpen] = useState(false);
  const [updateLocOpen, setUpdateLocOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [assignDriverOpen, setAssignDriverOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  type AvailableDriver = {
    id: string; rating: number; totalTrips: number;
    user: { firstName: string; lastName: string; phone: string; avatar: string | null };
  };
  const { data: availableDrivers, isLoading: driversLoading } = useSWR<AvailableDriver[]>(
    assignDriverOpen ? '/fleet/drivers/available' : null,
    fetcher,
  );

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
  const timeline = timelineFor(order.id);
  const showActions = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status);
  type ApiBid = { id: string; carrierId: string; status: string; proposedPickupDate?: string; proposedDeliveryDate?: string; estimatedDeliveryDate?: string };
  const apiBids: ApiBid[] = (order as unknown as { bids?: ApiBid[] }).bids ?? [];
  const myAcceptedBid = apiBids.find((b) => b.status === 'ACCEPTED');
  const effectivePickup = myAcceptedBid?.proposedPickupDate ?? order.pickupDate;
  const effectiveDelivery =
    myAcceptedBid?.proposedDeliveryDate
    ?? myAcceptedBid?.estimatedDeliveryDate
    ?? (order as { deliveryDate?: string }).deliveryDate
    ?? null;
  const showShipmentCard = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status);

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        subtitle={formatDateTime(order.createdAt)}
        actions={
          <>
            <StatusBadge status={order.status} />
            <Button variant="outline" onClick={() => router.push('/orders')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {showShipmentCard && (
            <ShipmentStatusCard
              order={order}
              effectivePickup={effectivePickup}
              effectiveDelivery={effectiveDelivery}
              fromCarrierBid={!!(myAcceptedBid?.proposedDeliveryDate || myAcceptedBid?.proposedPickupDate)}
              events={timeline}
              titles={TITLES}
            />
          )}

          {showActions && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    إجراءات الطلب
                  </CardTitle>
                  <StatusBadge status={order.status} />
                </div>
              </CardHeader>
              <CardContent>
                {order.status === 'ASSIGNED' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      الطلب أُسند إليك. أكّد البدء عند الشروع في تنفيذ الخدمة.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={() => setConfirmPickupOpen(true)} className="flex-1 sm:flex-none">
                        <CheckCircle2 className="h-4 w-4" /> تأكيد البدء
                      </Button>
                      <Button variant="outline" onClick={() => setAssignDriverOpen(true)} className="flex-1 sm:flex-none">
                        <Users className="h-4 w-4" /> إسناد لموظف
                      </Button>
                      <Button variant="outline" onClick={() => setDisputeOpen(true)} className="text-destructive border-destructive/30">
                        <Shield className="h-4 w-4" /> فتح نزاع
                      </Button>
                    </div>
                  </div>
                )}
                {order.status === 'CONFIRMED' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      تم تأكيد البدء. ابدأ التنفيذ الفعلي عند الجاهزية.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={() => setStartTripOpen(true)} className="flex-1 sm:flex-none">
                        <Truck className="h-4 w-4" /> بدء التنفيذ
                      </Button>
                      <Button variant="outline" onClick={() => setDisputeOpen(true)} className="text-destructive border-destructive/30">
                        <Shield className="h-4 w-4" /> فتح نزاع
                      </Button>
                    </div>
                  </div>
                )}
                {order.status === 'IN_TRANSIT' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-block h-2 w-2 bg-info rounded-full animate-pulse" />
                      <span className="text-muted-foreground">الخدمة قيد التنفيذ</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={() => setMarkDeliveredOpen(true)} className="flex-1 sm:flex-none">
                        <CheckCircle2 className="h-4 w-4" /> تأكيد الإتمام
                      </Button>
                      <Button variant="outline" onClick={() => setUpdateLocOpen(true)}>
                        <MapPin className="h-4 w-4" /> تحديث الحالة
                      </Button>
                      <Button variant="outline" onClick={() => setDisputeOpen(true)} className="text-destructive border-destructive/30">
                        <Shield className="h-4 w-4" /> فتح نزاع
                      </Button>
                    </div>
                  </div>
                )}
                {order.status === 'DELIVERED' && (
                  <EscrowCountdown
                    deliveredAt={timeline.find((t) => t.kind === 'DELIVERED')?.at ?? new Date()}
                    total={order.agreedPrice ?? 0}
                  />
                )}
                {order.status === 'COMPLETED' && (
                  <div className="rounded-md bg-success/10 border border-success/30 p-3 flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">الخدمة مكتملة وتم تحويل المبلغ</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        صافي المستلم: <Currency amount={order.providerAmount ?? 0} />
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {order.agreedPrice && ['CONFIRMED', 'IN_TRANSIT', 'DELIVERED'].includes(order.status) && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-warning/15 text-warning grid place-items-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm">مبلغ Escrow محتجز</span>
                      <Badge variant="warning">محجوز</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      سيُفرَج تلقائياً بعد تأكيد العميل لإتمام الخدمة
                    </p>
                    <dl className="mt-3 pt-3 border-t space-y-1 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">المبلغ المتّفق</dt>
                        <dd className="font-medium"><Currency amount={order.agreedPrice} /></dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">عمولة المنصة (8%)</dt>
                        <dd className="text-destructive">−<Currency amount={(order.commission ?? order.agreedPrice * 0.08)} /></dd>
                      </div>
                      <div className="flex justify-between pt-1 border-t font-semibold">
                        <dt>صافي مستحقّك</dt>
                        <dd className="text-success"><Currency amount={order.providerAmount ?? (order.agreedPrice * 0.92)} /></dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!showShipmentCard && (
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
        </div>

        <div className="space-y-6">
          {client && (
            <Card>
              <CardHeader><CardTitle>العميل</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{(client.nameAr ?? '').split(' ').slice(0, 2).map((w) => w[0] ?? '').join('')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{client.nameAr}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {client.city}
                    </div>
                  </div>
                </div>
                <dl className="divide-y">
                  <Row label="رقم التواصل" icon={Phone} value={<span className="num" dir="ltr">{client.contactPhone}</span>} />
                  <Row label="البريد" icon={Mail} value={<span className="num text-xs">{client.contactEmail}</span>} />
                </dl>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>تفاصيل الطلب</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="الوصف" value={order.cargoDescription} />
                <Row label="نوع الخدمة" icon={Truck} value={order.truckType} />
                <Row label="تأمين" icon={ShieldCheck} value={order.requiresInsurance ? 'مطلوب' : '—'} />
                {order.originAddress && (
                  <Row label="موقع التنفيذ" icon={MapPin} value={order.originAddress} />
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>المالية</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="السعر المتفق" value={<Currency amount={order.agreedPrice} />} />
                <Row label="العمولة" value={<Currency amount={order.commission ?? 0} />} />
                <Row label="صافي إلى حسابك" value={<Currency amount={order.providerAmount} />} />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm start (ASSIGNED → CONFIRMED) */}
      <Dialog open={confirmPickupOpen} onOpenChange={setConfirmPickupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد البدء</DialogTitle>
            <DialogDescription>سيتحوّل الطلب إلى "مؤكَّد" ويصل إشعار للعميل.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm">هل أنت جاهز لبدء تنفيذ الخدمة في الموعد المتفق؟</p>
            <div className="rounded-md bg-info/10 border border-info/30 p-3 text-xs flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <span className="text-muted-foreground">بعد التأكيد انقر "بدء التنفيذ" عند الشروع الفعلي في الخدمة.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPickupOpen(false)}>إلغاء</Button>
            <Button
              onClick={async () => {
                if (!order) return;
                try {
                  await api.post(`/orders/${order.id}/confirm`, {});
                  notify.success('تم تأكيد البدء', 'الطلب أصبح مؤكَّداً');
                  await refetchOrder();
                  setConfirmPickupOpen(false);
                } catch (err: unknown) {
                  notify.error(err, 'فشل تأكيد البدء');
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start execution (CONFIRMED → IN_TRANSIT) */}
      <Dialog open={startTripOpen} onOpenChange={setStartTripOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بدء التنفيذ</DialogTitle>
            <DialogDescription>سيتحوّل الطلب إلى "قيد التنفيذ" ويصل إشعار للعميل.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm">هل شرعت فعلياً في تنفيذ الخدمة؟</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartTripOpen(false)}>إلغاء</Button>
            <Button
              onClick={async () => {
                if (!order) return;
                try {
                  await api.post(`/orders/${order.id}/tracking`, {
                    status: 'PICKED_UP',
                    description: 'بدأ التنفيذ — الخدمة قيد التنفيذ',
                  });
                  notify.success('بدأ التنفيذ', 'العميل مُحدَّث بحالة الطلب');
                  await refetchOrder();
                  setStartTripOpen(false);
                } catch (err: unknown) {
                  notify.error(err, 'فشل تحديث الحالة');
                }
              }}
            >
              <Truck className="h-4 w-4" /> بدء التنفيذ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark completed */}
      <Dialog open={markDeliveredOpen} onOpenChange={setMarkDeliveredOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد إتمام الخدمة</DialogTitle>
            <DialogDescription>سيُرسل إشعار للعميل ليؤكد الاستلام ويُفرَج المبلغ.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm">تأكّد قبل الإغلاق من:</p>
            <ul className="list-disc ps-6 space-y-1 text-sm text-muted-foreground">
              <li>حصلت على توقيع العميل أو مندوبه</li>
              <li>تم تسليم جميع مخرجات الخدمة</li>
              <li>لا توجد ملاحظات معلقة</li>
            </ul>
            <div className="rounded-md bg-success/10 border border-success/30 p-3 text-xs flex items-start gap-2 mt-3">
              <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                سيُحوَّل مبلغك تلقائياً من Escrow بعد تأكيد العميل أو خلال 72 ساعة.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkDeliveredOpen(false)}>إلغاء</Button>
            <Button
              onClick={async () => {
                if (!order) return;
                try {
                  await api.post(`/orders/${order.id}/deliver`, {});
                  playSoundIfEnabled('orderCompleted');
                  notify.success('تم تأكيد إتمام الخدمة', 'سيُفرَج المبلغ بعد تأكيد العميل أو خلال 72 ساعة');
                  await refetchOrder();
                  setMarkDeliveredOpen(false);
                } catch (err: unknown) {
                  notify.error(err, 'فشل تأكيد الإتمام');
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> تأكيد الإتمام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update status */}
      <Dialog open={updateLocOpen} onOpenChange={setUpdateLocOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة التنفيذ</DialogTitle>
            <DialogDescription>سيُحدَّث السجل لحظياً للعميل والأدمن.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>ملاحظة التحديث</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مثال: اكتملت مرحلة التركيب، جارٍ الاختبار" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateLocOpen(false)}>إلغاء</Button>
            <Button
              onClick={async () => {
                if (!order || !location) return;
                try {
                  await api.post(`/orders/${order.id}/tracking`, {
                    status: 'IN_TRANSIT',
                    description: location,
                  });
                  await refetchOrder();
                  notify.success('تم تحديث الحالة', 'سيظهر للعميل لحظياً');
                  setUpdateLocOpen(false);
                  setLocation('');
                } catch (err) {
                  notify.error(err, 'فشل تحديث الحالة');
                }
              }}
              disabled={!location}
            >
              <MapPin className="h-4 w-4" /> تحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign employee */}
      <Dialog open={assignDriverOpen} onOpenChange={setAssignDriverOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إسناد موظف للطلب</DialogTitle>
            <DialogDescription>اختر أحد الموظفين المتاحين في شركتك.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
            {driversLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">جارٍ التحميل…</p>
            )}
            {!driversLoading && (!availableDrivers || availableDrivers.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">لا يوجد موظفون متاحون حالياً.</p>
            )}
            {availableDrivers?.map((driver) => (
              <button
                key={driver.id}
                type="button"
                onClick={() => setSelectedDriverId(driver.id)}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 text-start transition-colors
                  ${selectedDriverId === driver.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <div className="h-9 w-9 rounded-full bg-muted grid place-items-center shrink-0">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{driver.user.firstName} {driver.user.lastName}</div>
                  <div className="text-xs text-muted-foreground">{driver.user.phone} · {driver.totalTrips} مهمة</div>
                </div>
                {selectedDriverId === driver.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDriverOpen(false); setSelectedDriverId(null); }}>إلغاء</Button>
            <Button
              disabled={!selectedDriverId}
              onClick={async () => {
                if (!order || !selectedDriverId) return;
                try {
                  await api.post(`/orders/${order.id}/assign-driver`, { driverId: selectedDriverId });
                  notify.success('تم إسناد الموظف', 'الموظف المختار مُكلَّف بهذا الطلب');
                  await refetchOrder();
                  setAssignDriverOpen(false);
                  setSelectedDriverId(null);
                } catch (err: unknown) {
                  notify.error(err, 'فشل إسناد الموظف');
                }
              }}
            >
              <Users className="h-4 w-4" /> إسناد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open dispute */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>فتح نزاع</DialogTitle>
            <DialogDescription>سيراجع فريق الدعم النزاع خلال 24 ساعة.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">سيتم نقلك لصفحة النزاعات لإكمال البيانات.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>إلغاء</Button>
            <Button onClick={() => { router.push('/disputes'); }}>
              <Shield className="h-4 w-4" /> الانتقال لصفحة النزاعات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShipmentStatusCard({
  order, effectivePickup, effectiveDelivery, fromCarrierBid, events, titles,
}: {
  order: any;
  effectivePickup: string | undefined;
  effectiveDelivery: string | null;
  fromCarrierBid: boolean;
  events: Array<{ kind: string; at: string | Date; note?: string; by?: string }>;
  titles: Record<string, string>;
}) {
  const meta: Record<string, { text: string; step: 1 | 2 | 3; tone: 'info' | 'warning' | 'success' }> = {
    ASSIGNED:   { text: 'الطلب أُسند إليك — استعد للبدء في الموعد المتفق',      step: 1, tone: 'info' },
    CONFIRMED:  { text: 'أكّدت البدء — جاهز للتنفيذ',                          step: 1, tone: 'info' },
    IN_TRANSIT: { text: 'الخدمة قيد التنفيذ',                                  step: 2, tone: 'warning' },
    DELIVERED:  { text: 'تم إتمام الخدمة — بانتظار تأكيد العميل',              step: 3, tone: 'warning' },
    COMPLETED:  { text: 'مكتمل — تم الإفراج عن المبلغ',                        step: 3, tone: 'success' },
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
        <div className="flex items-center gap-2">
          {[
            { s: 1 as const, label: 'البدء',        icon: MapPin },
            { s: 2 as const, label: 'قيد التنفيذ',  icon: Truck },
            { s: 3 as const, label: 'الإتمام',      icon: CheckCircle2 },
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
            <div className="text-xs text-muted-foreground">📅 موعد البدء</div>
            <div className="mt-0.5 font-medium">
              {effectivePickup ? formatDate(effectivePickup, 'EEEE d MMM') : '—'}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">✅ موعد الإتمام المتوقع</div>
            <div className="mt-0.5 font-medium">
              {effectiveDelivery ? formatDate(effectiveDelivery, 'EEEE d MMM') : 'سيُحدَّد لاحقاً'}
            </div>
            {fromCarrierBid && (
              <Badge variant="outline" className="mt-1 h-4 text-[10px]">حسب عرضك</Badge>
            )}
          </div>
        </div>

        {events && events.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">سجل الأحداث</div>
            <ol className="relative space-y-3">
              {events.map((ev, i) => (
                <li key={i} className="relative ps-7">
                  {i < events.length - 1 && <span aria-hidden className="absolute top-5 bottom-[-12px] start-[9px] w-px bg-border" />}
                  <span className="absolute start-0 top-1 grid place-items-center h-5 w-5 rounded-full bg-primary border-2 border-background">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </span>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{titles[ev.kind] ?? ev.kind}</div>
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
