'use client';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  ArrowRight, Calendar, FileText, Fuel, Gauge, Truck, User, Wrench,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { SaudiPlate, parsePlateString } from '@/components/saudi-plate';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import { useTruckTypesStore } from '@/stores/truck-types-store';
import { fetcher } from '@/lib/api';
import { DRIVERS, TRUCKS, formatDate, normalizeTruck, tripsForTruck } from '@naqla/shared-utils';

export default function TruckDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // ─── All hooks MUST be called unconditionally, BEFORE any early return.
  // Putting `useTruckTypesStore` after the `if (!truck) return` branch causes
  // "Rendered more hooks than during the previous render" once `truckData`
  // resolves and the early-return branch flips. Keep all hooks at the top.
  const { data: truckData } = useSWR<unknown>(params?.id ? `/fleet/trucks/${params.id}` : null, fetcher);
  const truckTypes = useTruckTypesStore((s) => s.types);

  const truck = (() => {
    if (truckData && typeof truckData === 'object') {
      const normalized = normalizeTruck(truckData as typeof TRUCKS[number]);
      if (normalized) return normalized as typeof TRUCKS[number];
    }
    return TRUCKS.find((t) => t.id === params.id);
  })();

  if (!truck) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Truck className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">الشاحنة غير موجودة</h3>
          <Button onClick={() => router.push('/fleet/trucks')} className="mt-4">عودة للأسطول</Button>
        </CardContent>
      </Card>
    );
  }

  const driver = DRIVERS.find((d) => d.id === truck.assignedDriverId);
  const trips = tripsForTruck(truck.id);
  const truckType = truckTypes.find((t) => t.id === truck.truckType);
  const meta = {
    label: truckType?.nameAr ?? truck.truckType,
    icon: truckType?.icon ?? '🚚',
    imageUrl: truckType?.imageUrl,
    description: truckType?.description,
  };

  const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0);
  const totalAmount = trips.filter((t) => t.status === 'COMPLETED' || t.status === 'DELIVERED').reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <PageHeader
        title={`الشاحنة ${truck.plateNumber}`}
        subtitle={`${meta.label}${truck.modelYear ? ` · موديل ${truck.modelYear}` : ''} · ${((truck.capacityKg ?? 0) / 1000).toFixed(0)} طن`}
        actions={
          <>
            <StatusBadge status={truck.status} />
            <Button variant="outline" onClick={() => router.push('/fleet/trucks')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main col — info + trips */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image + Plate */}
          <Card>
            <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="h-44 w-64 rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 grid place-items-center shrink-0 border overflow-hidden p-3" aria-hidden>
                {meta.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meta.imageUrl}
                      alt={meta.label}
                      className="max-h-full max-w-full object-contain drop-shadow-md"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.style.display = 'none';
                        const fb = t.nextElementSibling as HTMLElement;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div className="text-5xl" style={{ display: 'none' }}>{meta.icon}</div>
                  </>
                ) : (
                  <div className="text-5xl">{meta.icon}</div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-3 text-center sm:text-start">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h3 className="text-lg font-bold">{meta.label}</h3>
                  <Badge variant="outline" className="num">{((truck.capacityKg ?? 0) / 1000).toFixed(0)} طن</Badge>
                </div>
                {(() => {
                  const parsed = parsePlateString(truck.plateNumber ?? '');
                  return <SaudiPlate letters={parsed.letters} numbers={parsed.numbers} type="public" size="lg" />;
                })()}
                <div className="text-sm text-muted-foreground">
                  لوحة سعودية رسمية · مسجّلة لدى المرور
                </div>
                {meta.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t">
                    {meta.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader><CardTitle>المواصفات</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Spec icon={Truck}  label="النوع"          value={meta.label} />
                <Spec icon={Gauge}  label="الحمولة"        value={`${((truck.capacityKg ?? 0) / 1000).toFixed(0)} طن`} />
                <Spec icon={Calendar} label="موديل السنة"  value={truck.modelYear ? String(truck.modelYear) : '—'} />
                <Spec icon={Fuel}   label="الوقود"         value="ديزل" />
                <Spec icon={Wrench} label="آخر فحص"        value={truck.lastInspection ? formatDate(truck.lastInspection) : '—'} />
                <Spec               label="رقم الشاسيه"    value="—" />
              </div>
            </CardContent>
          </Card>

          {/* Trips */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>سجل الرحلات</CardTitle>
                  <CardDescription className="mt-1">{trips.length} رحلة · إجمالي مسافة <span className="num">{totalKm.toLocaleString('en-US')}</span> كم</CardDescription>
                </div>
                <Currency amount={totalAmount} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المسار</TableHead>
                    <TableHead>الانطلاق</TableHead>
                    <TableHead>الوصول</TableHead>
                    <TableHead className="text-end">المسافة</TableHead>
                    <TableHead className="text-end">المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                        لا توجد رحلات بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    trips.map((t) => (
                      <TableRow key={t.orderId} className="cursor-pointer" onClick={() => (window.location.href = `/orders/${t.orderId}`)}>
                        <TableCell className="font-mono text-xs text-primary">{t.orderId}</TableCell>
                        <TableCell className="truncate max-w-[180px]">{t.clientName}</TableCell>
                        <TableCell>{t.originCity} ← {t.destinationCity}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(t.startedAt, 'd MMM · HH:mm')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.finishedAt ? formatDate(t.finishedAt, 'd MMM · HH:mm') : '—'}</TableCell>
                        <TableCell className="text-end num">{t.distanceKm.toLocaleString('en-US')} كم</TableCell>
                        <TableCell className="text-end"><Currency amount={t.amount} /></TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Side col — driver + docs */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>السائق الحالي</CardTitle></CardHeader>
            <CardContent>
              {driver ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{driver.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{driver.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="num">{driver.totalTrips}</span> رحلة · {driver.licenseClass}
                    </div>
                  </div>
                  <StatusBadge status={driver.status} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  لا يوجد سائق مُخصّص
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الوثائق</CardTitle>
              <CardDescription className="mt-1">تواريخ صلاحية رخص الشاحنة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'الاستمارة',     expiry: '2027-04-15', state: 'valid' },
                { label: 'التأمين الشامل', expiry: '2026-12-01', state: 'valid' },
                {
                  label: 'الفحص الدوري',
                  expiry: truck.lastInspection
                    ? truck.lastInspection.slice(0, 10).split('-').map((p, i) => i === 0 ? String(Number(p) + 1) : p).join('-')
                    : '—',
                  state: 'valid',
                },
              ].map((doc) => (
                <div key={doc.label} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-9 w-9 rounded-md bg-muted text-muted-foreground grid place-items-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{doc.label}</div>
                    <div className="text-xs text-muted-foreground">تنتهي: {doc.expiry !== '—' ? formatDate(doc.expiry, 'd MMM yyyy') : '—'}</div>
                  </div>
                  <Badge variant="success">سارية</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Spec({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && (
        <div className="h-9 w-9 rounded-md bg-muted text-muted-foreground grid place-items-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
