'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, Clock, MapPin, Navigation, Package, Phone,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { RouteMap } from '@/components/route-map';
import { StatusBadge } from '@/components/status-badge';
import {
  CURRENT_CLIENT_ID, activeOrdersForClient, companyById, coordsFor, distanceKm,
  estimatedDurationLabel, formatDateTime, primaryRoadFor,
} from '@naqla/shared-utils';

export default function TrackingPage() {
  const active = activeOrdersForClient(CURRENT_CLIENT_ID);
  const inTransit = active.filter((o) => o.status === 'IN_TRANSIT' || o.status === 'CONFIRMED');
  const [selectedId, setSelectedId] = useState<string | null>(inTransit[0]?.id ?? null);
  const selected = inTransit.find((o) => o.id === selectedId) ?? inTransit[0];

  if (inTransit.length === 0) {
    return (
      <>
        <PageHeader title="التتبع المباشر" subtitle="تابع تقدّم طلباتك في الوقت الفعلي" />
        <Card>
          <CardContent className="py-20 text-center">
            <Briefcase className="h-14 w-14 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="font-semibold">لا توجد طلبات نشطة حالياً</h3>
            <p className="mt-2 text-sm text-muted-foreground">سيظهر هنا التتبع المباشر فور بدء تنفيذ أي طلب</p>
            <Button asChild className="mt-4">
              <Link href="/orders/new">إنشاء طلب جديد</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="التتبع المباشر"
        subtitle={`${inTransit.length} طلب قيد التنفيذ`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Left list */}
        <Card className="lg:order-1 order-2">
          <CardHeader>
            <CardTitle className="text-base">الشحنات النشطة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {inTransit.map((o) => {
              const isSelected = selected?.id === o.id;
              const provider = companyById(o.carrierId);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className={`w-full text-start rounded-lg border p-3 transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs text-primary">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-sm font-medium truncate">{o.originCity} ← {o.destinationCity}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{provider?.nameAr ?? '—'}</div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Right map+details */}
        {selected && (
          <div className="space-y-6 lg:order-2 order-1">
            <TrackingDetail order={selected} />
          </div>
        )}
      </div>
    </>
  );
}

function TrackingDetail({ order }: { order: any }) {
  const o = coordsFor(order.originCity);
  const d = coordsFor(order.destinationCity);
  const km = distanceKm(o, d);
  const duration = estimatedDurationLabel(km);
  const road = primaryRoadFor(order.originCity, order.destinationCity);
  const progress = order.status === 'IN_TRANSIT' ? 0.55 : order.status === 'CONFIRMED' ? 0.1 : 0;
  const remaining = Math.round(km * (1 - progress));
  const provider = companyById(order.carrierId);
  const initials = provider?.nameAr.split(' ').slice(0, 2).map((w) => w[0]).join('') ?? '';

  return (
    <>
      <Card>
        <RouteMap
          origin={{ ...o, label: order.originCity }}
          destination={{ ...d, label: order.destinationCity }}
          progress={progress}
          height={420}
          className="rounded-b-none border-b"
        />
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <Stat icon="📍" label="إجمالي المسافة" value={<span className="num">{km.toLocaleString('en-US')} كم</span>} />
          <Stat icon="🚚" label="متبقّي" value={<span className="num text-success font-bold">{remaining.toLocaleString('en-US')} كم</span>} />
          <Stat icon="⏱" label="الوصول المتوقّع" value={duration} />
          <Stat icon="🛣" label="الطريق" value={road} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> المزوّد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{provider?.nameAr ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{provider?.completedTrips} طلب · ⭐ {provider?.rating?.toFixed(1)}</div>
              </div>
              <Button size="sm" variant="outline"><Phone className="h-3.5 w-3.5" /></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> تفاصيل الطلب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاريخ البدء</span>
              <span className="font-medium text-xs">{formatDateTime(order.pickupDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الطلب</span>
              <Link href={`/orders/${order.id}`} className="font-mono text-xs text-primary">{order.orderNumber}</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live position indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-info/15 text-info grid place-items-center shrink-0 animate-pulse">
              <Navigation className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold">الموقع الحالي للمزوّد</span>
                <Badge variant="success" className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 bg-success rounded-full animate-pulse" />
                  مباشر
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 inline me-1" />
                قيد التنفيذ في <strong>{order.originCity}</strong>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 inline me-1" />
                آخر تحديث: قبل دقائق
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>التقدّم</span>
              <span className="num font-medium">{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-success" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
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
