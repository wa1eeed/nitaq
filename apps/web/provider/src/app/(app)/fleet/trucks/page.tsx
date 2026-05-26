'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Briefcase, CheckCircle, Clock, Plus, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { useTruckTypesStore } from '@/stores/truck-types-store';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { normalizeServiceList, TRUCKS } from '@naqla/shared-utils';

export default function ProviderFleetServices() {
  const [tab, setTab] = useState('ALL');
  const serviceTypeCatalog = useTruckTypesStore((s) => s.types);
  const { data } = useSWR<unknown>('/fleet/trucks', fetcher);

  const all = useMemo(() => {
    const normalized = normalizeServiceList<typeof TRUCKS[number]>(data);
    return normalized.length > 0 ? normalized : TRUCKS;
  }, [data]);

  const isOnAssignment = (status: string) => status === 'ON_TRIP' || status === 'ON_ASSIGNMENT';

  const rows = useMemo(() => {
    if (tab === 'ALL') return all;
    if (tab === 'ON_ASSIGNMENT') return all.filter((s) => isOnAssignment(s.status));
    return all.filter((s) => s.status === tab);
  }, [tab, all]);

  const total = all.length;
  const available = all.filter((s) => s.status === 'AVAILABLE').length;
  const onAssignment = all.filter((s) => isOnAssignment(s.status)).length;
  const maintenance = all.filter((s) => s.status === 'MAINTENANCE').length;

  const getTypeName = (typeId: string) =>
    serviceTypeCatalog.find((t) => t.id === typeId)?.nameAr ?? typeId ?? '—';

  return (
    <>
      <PageHeader
        title="الخدمات"
        subtitle={`${total} خدمة مسجّلة`}
        actions={
          <Link href="/fleet/trucks/new">
            <Button>
              <Plus className="h-4 w-4" />
              إضافة خدمة
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard label="إجمالي الخدمات" value={total} hint="خدمة" icon={Briefcase} tone="default" />
        <StatsCard label="متاحة" value={available} hint="جاهزة الآن" icon={CheckCircle} tone="success" />
        <StatsCard label="قيد التنفيذ" value={onAssignment} hint="حالياً" icon={Clock} tone="default" />
        <StatsCard label="موقوفة" value={maintenance} hint="غير متاحة" icon={Wrench} tone="warning" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="ALL">الكل <Badge variant="secondary" className="ms-1">{total}</Badge></TabsTrigger>
          <TabsTrigger value="AVAILABLE">متاحة <Badge variant="secondary" className="ms-1">{available}</Badge></TabsTrigger>
          <TabsTrigger value="ON_ASSIGNMENT">قيد التنفيذ <Badge variant="secondary" className="ms-1">{onAssignment}</Badge></TabsTrigger>
          <TabsTrigger value="MAINTENANCE">موقوفة <Badge variant="secondary" className="ms-1">{maintenance}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الخدمة</TableHead>
                <TableHead>نوع الخدمة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const typeIcon = serviceTypeCatalog.find((t) => t.id === s.truckType)?.icon ?? '⚡';
                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => (window.location.href = `/fleet/trucks/${s.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeIcon}</span>
                        <span className="font-medium">{s.plateNumber || s.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getTypeName(s.truckType)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                      {(s as typeof s & { description?: string }).description ?? '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    لا توجد خدمات
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
