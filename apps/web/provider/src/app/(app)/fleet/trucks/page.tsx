'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Plus, Truck, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { SaudiPlate, parsePlateString } from '@/components/saudi-plate';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { DRIVERS, TRUCKS, formatDate, normalizeServiceList } from '@naqla/shared-utils';

const TRUCK_LABELS: Record<string, string> = {
  SMALL_VAN: 'فان صغير', BOX_TRUCK: 'صندوق مغلق', MEDIUM_FLATBED: 'مسطح متوسط',
  LARGE_FLATBED: 'مسطح كبير', REFRIGERATED: 'مبرّد', TANKER: 'صهريج',
  LOWBED: 'لوبد', CONTAINER_TRAILER: 'حاوية',
};

export default function CarrierFleetTrucks() {
  const [tab, setTab] = useState('ALL');
  // GET /fleet/trucks — `normalizeServiceList` aliases Prisma field names
  // (`type`, `capacity`, `year`) to the mock shape (`truckType`,
  // `capacityKg`, `modelYear`) the UI was written against. Falls back to
  // mock TRUCKS for offline demos.
  const { data } = useSWR<unknown>('/fleet/trucks', fetcher);
  const all = useMemo(() => {
    const normalized = normalizeServiceList<typeof TRUCKS[number]>(data);
    return normalized.length > 0 ? normalized : TRUCKS;
  }, [data]);
  const rows = useMemo(() => (tab === 'ALL' ? all : all.filter((t) => t.status === tab)), [tab, all]);
  const total = all.length;
  const available = all.filter((t) => t.status === 'AVAILABLE').length;
  const onTrip = all.filter((t) => t.status === 'ON_TRIP').length;
  const maintenance = all.filter((t) => t.status === 'MAINTENANCE').length;

  return (
    <>
      <PageHeader
        title="الأسطول"
        subtitle={`${total} شاحنة مسجّلة`}
        actions={
          <Link href="/fleet/trucks/new">
            <Button>
              <Plus className="h-4 w-4" />
              إضافة شاحنة
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard label="إجمالي الأسطول" value={total} hint="شاحنة" icon={Truck} tone="default" />
        <StatsCard label="متاحة" value={available} hint="جاهزة الآن" icon={CheckCircle} tone="success" />
        <StatsCard label="في رحلة" value={onTrip} hint="حالياً" icon={Clock} tone="default" />
        <StatsCard label="صيانة" value={maintenance} hint="غير متاحة" icon={Wrench} tone="warning" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="ALL">الكل <Badge variant="secondary" className="ms-1">{total}</Badge></TabsTrigger>
          <TabsTrigger value="AVAILABLE">متاحة <Badge variant="secondary" className="ms-1">{available}</Badge></TabsTrigger>
          <TabsTrigger value="ON_TRIP">في رحلة <Badge variant="secondary" className="ms-1">{onTrip}</Badge></TabsTrigger>
          <TabsTrigger value="MAINTENANCE">صيانة <Badge variant="secondary" className="ms-1">{maintenance}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>لوحة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead className="text-end">الحمولة</TableHead>
                <TableHead className="text-center">الموديل</TableHead>
                <TableHead>السائق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر فحص</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t, idx) => {
                const drv = DRIVERS.find((d) => d.id === t.assignedDriverId);
                const parsed = parsePlateString(t.plateNumber ?? '');
                const type = idx % 2 === 0 ? 'public' as const : 'light' as const;
                // Tons: prefer the normalized `capacity` (API, in tons) → fall back
                // to `capacityKg / 1000`. The mock type doesn't declare `capacity`
                // but the normalizer adds it, so we read it via a permissive cast.
                const tt = t as typeof t & { capacity?: number };
                const tons = tt.capacity != null
                  ? Math.round(tt.capacity)
                  : ((t.capacityKg ?? 0) / 1000);
                return (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => (window.location.href = `/fleet/trucks/${t.id}`)}>
                    <TableCell>
                      <SaudiPlate letters={parsed.letters} numbers={parsed.numbers} type={type} size="sm" />
                    </TableCell>
                    <TableCell>{TRUCK_LABELS[t.truckType] ?? t.truckType ?? '—'}</TableCell>
                    <TableCell className="text-end num">{tons.toFixed(0)} طن</TableCell>
                    <TableCell className="text-center num">{t.modelYear || '—'}</TableCell>
                    <TableCell>{drv ? drv.fullName : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.lastInspection ? formatDate(t.lastInspection) : '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
