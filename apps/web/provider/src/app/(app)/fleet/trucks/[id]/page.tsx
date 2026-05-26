'use client';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowRight, Briefcase, Calendar, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import { useTruckTypesStore } from '@/stores/truck-types-store';
import { fetcher } from '@/lib/api';
import { TRUCKS, formatDate, normalizeService, tripsForTruck } from '@naqla/shared-utils';

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: serviceData } = useSWR<unknown>(params?.id ? `/fleet/trucks/${params.id}` : null, fetcher);
  const serviceTypeCatalog = useTruckTypesStore((s) => s.types);

  const service = (() => {
    if (serviceData && typeof serviceData === 'object') {
      const normalized = normalizeService(serviceData as typeof TRUCKS[number]);
      if (normalized) return normalized as typeof TRUCKS[number];
    }
    return TRUCKS.find((t) => t.id === params.id);
  })();

  if (!service) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">الخدمة غير موجودة</h3>
          <Button onClick={() => router.push('/fleet/trucks')} className="mt-4">عودة للخدمات</Button>
        </CardContent>
      </Card>
    );
  }

  const trips = tripsForTruck(service.id);
  const serviceType = serviceTypeCatalog.find((t) => t.id === service.truckType);
  const typeName = serviceType?.nameAr ?? service.truckType ?? '—';
  const typeIcon = serviceType?.icon ?? '⚡';
  const description = (service as typeof service & { description?: string }).description;
  const basePrice = (service as typeof service & { basePrice?: number }).basePrice;
  const coveredCities = (service as typeof service & { coveredCities?: string[] }).coveredCities;
  const maxConcurrentOrders = (service as typeof service & { maxConcurrentOrders?: number }).maxConcurrentOrders;

  const totalAmount = trips
    .filter((t) => t.status === 'COMPLETED' || t.status === 'DELIVERED')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <PageHeader
        title={service.plateNumber || `خدمة #${service.id}`}
        subtitle={typeName}
        actions={
          <>
            <StatusBadge status={service.status} />
            <Button variant="outline" onClick={() => router.push('/fleet/trucks')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Service overview */}
          <Card>
            <CardContent className="pt-6 flex items-start gap-5">
              <div className="h-16 w-16 rounded-xl bg-muted grid place-items-center shrink-0 text-3xl">
                {typeIcon}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold">{service.plateNumber || `خدمة #${service.id}`}</h3>
                  <Badge variant="outline">{typeName}</Badge>
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                )}
                {serviceType?.description && !description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{serviceType.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader><CardTitle>تفاصيل الخدمة</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Spec icon={Briefcase} label="نوع الخدمة" value={typeName} />
                {basePrice != null && (
                  <Spec icon={Calendar} label="السعر الابتدائي" value={`${basePrice.toLocaleString('ar-SA')} ريال`} />
                )}
                {maxConcurrentOrders != null && (
                  <Spec icon={Users} label="الحد الأقصى للطلبات" value={String(maxConcurrentOrders)} />
                )}
                {coveredCities && coveredCities.length > 0 && (
                  <div className="col-span-2 md:col-span-3">
                    <Spec icon={MapPin} label="المدن المخدومة" value={coveredCities.join('، ')} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignments history */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>سجل المهام</CardTitle>
                  <CardDescription className="mt-1">{trips.length} مهمة منجزة</CardDescription>
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
                    <TableHead>تاريخ البدء</TableHead>
                    <TableHead>تاريخ الانتهاء</TableHead>
                    <TableHead className="text-end">المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        لا توجد مهام بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    trips.map((t) => (
                      <TableRow key={t.orderId} className="cursor-pointer" onClick={() => (window.location.href = `/orders/${t.orderId}`)}>
                        <TableCell className="font-mono text-xs text-primary">{t.orderId}</TableCell>
                        <TableCell className="truncate max-w-[180px]">{t.clientName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(t.startedAt, 'd MMM · HH:mm')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.finishedAt ? formatDate(t.finishedAt, 'd MMM · HH:mm') : '—'}</TableCell>
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

        {/* Side col */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إحصاءات الخدمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="إجمالي المهام" value={String(trips.length)} />
              <StatRow label="المهام المنجزة" value={String(trips.filter((t) => t.status === 'COMPLETED' || t.status === 'DELIVERED').length)} />
              <StatRow label="الإيرادات الكلية" value={`${totalAmount.toLocaleString('ar-SA')} ريال`} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Spec({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string }) {
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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
