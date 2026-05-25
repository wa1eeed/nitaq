'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Filter, Search, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { SaudiPlate, parsePlateString } from '@/components/saudi-plate';
import { StatusBadge } from '@/components/status-badge';
import { StatsCard } from '@/components/stats-card';
import { TRUCKS, carrierById, driverById, formatDate } from '@naqla/shared-utils';

const TYPE_LABELS: Record<string, string> = {
  SMALL_VAN: 'فان صغير', BOX_TRUCK: 'صندوق', MEDIUM_FLATBED: 'مسطح متوسط',
  LARGE_FLATBED: 'مسطح كبير', REFRIGERATED: 'مبرّد', TANKER: 'صهريج',
  LOWBED: 'لوبد', CONTAINER_TRAILER: 'حاوية',
};

export default function AdminTrucksPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [type, setType] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return TRUCKS.filter((t) => {
      if (status !== 'ALL' && t.status !== status) return false;
      if (type !== 'ALL' && t.truckType !== type) return false;
      if (q) {
        const hay = `${t.plateNumber} ${t.id} ${carrierById(t.carrierId)?.nameAr ?? ''}`;
        if (!hay.toLowerCase().includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [q, status, type]);

  const total = TRUCKS.length;
  const onTrip = TRUCKS.filter((t) => t.status === 'ON_TRIP').length;
  const available = TRUCKS.filter((t) => t.status === 'AVAILABLE').length;
  const maintenance = TRUCKS.filter((t) => t.status === 'MAINTENANCE').length;

  return (
    <>
      <PageHeader
        title="كل الشاحنات في المنصة"
        subtitle="نظرة شاملة على أسطول جميع الناقلين المسجّلين"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="إجمالي الشاحنات" value={total.toLocaleString('en-US')} icon={Truck} />
        <StatsCard label="في رحلة" value={onTrip.toLocaleString('en-US')} icon={Truck} />
        <StatsCard label="متاحة" value={available.toLocaleString('en-US')} icon={Truck} tone="success" />
        <StatsCard label="صيانة" value={maintenance.toLocaleString('en-US')} icon={Truck} tone="warning" />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بلوحة، رقم، أو اسم الناقل..."
                className="pe-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                <SelectItem value="AVAILABLE">متاحة</SelectItem>
                <SelectItem value="ON_TRIP">في رحلة</SelectItem>
                <SelectItem value="MAINTENANCE">صيانة</SelectItem>
                <SelectItem value="OFF_DUTY">خارج الخدمة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأنواع</SelectItem>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اللوحة</TableHead>
                <TableHead>الناقل</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحمولة</TableHead>
                <TableHead>الموديل</TableHead>
                <TableHead>السائق</TableHead>
                <TableHead>الفحص الأخير</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    لا توجد نتائج
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => {
                  const plate = parsePlateString(t.plateNumber);
                  const carrier = carrierById(t.carrierId);
                  const drv = driverById(t.assignedDriverId);
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <SaudiPlate letters={plate.letters} numbers={plate.numbers} type="public" size="sm" />
                      </TableCell>
                      <TableCell>
                        <Link href={`/companies/${t.carrierId}`} className="font-medium hover:text-primary">
                          {carrier?.nameAr ?? '—'}
                        </Link>
                      </TableCell>
                      <TableCell>{TYPE_LABELS[t.truckType] ?? t.truckType}</TableCell>
                      <TableCell className="num">{(t.capacityKg / 1000).toFixed(0)} طن</TableCell>
                      <TableCell className="num">{t.modelYear}</TableCell>
                      <TableCell className="truncate max-w-[160px]">{drv?.fullName ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(t.lastInspection)}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
