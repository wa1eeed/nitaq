'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Filter, Phone, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { StatusBadge } from '@/components/status-badge';
import { StatsCard } from '@/components/stats-card';
import { fetcher } from '@/lib/api';
import { formatDate } from '@naqla/shared-utils';

type ApiDriver = {
  id: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: string;
  rating: number;
  totalTrips: number;
  isActive: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; phone: string; nationalId: string | null };
  company: { id: string; nameAr: string };
  orderDrivers: Array<{
    order: { id: string; orderNumber: string; status: string; originCity: string; destinationCity: string };
  }>;
};

export default function AdminDriversPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  const { data: raw } = useSWR<ApiDriver[] | { items?: ApiDriver[] }>('/admin/drivers?limit=200', fetcher);
  const apiDrivers: ApiDriver[] = useMemo(() => {
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (raw as { items?: ApiDriver[] }).items ?? [];
  }, [raw]);

  const filtered = useMemo(() => {
    return apiDrivers.filter((d) => {
      if (status !== 'ALL' && d.status !== status) return false;
      if (q) {
        const hay = `${d.user.firstName} ${d.user.lastName} ${d.user.phone ?? ''} ${d.user.nationalId ?? ''} ${d.company.nameAr}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [apiDrivers, q, status]);

  const total    = apiDrivers.length;
  const onTrip   = apiDrivers.filter((d) => d.status === 'ON_TRIP').length;
  const available = apiDrivers.filter((d) => d.status === 'AVAILABLE').length;
  const offDuty  = apiDrivers.filter((d) => d.status === 'OFF_DUTY').length;

  return (
    <>
      <PageHeader
        title="كل السائقين في المنصة"
        subtitle="قائمة موحّدة للسائقين عبر جميع شركات النقل"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="إجمالي السائقين" value={total.toLocaleString('en-US')}   icon={Users} />
        <StatsCard label="في رحلة"          value={onTrip.toLocaleString('en-US')}  icon={Users} tone="warning" />
        <StatsCard label="متاحون"            value={available.toLocaleString('en-US')} icon={Users} tone="success" />
        <StatsCard label="خارج الخدمة"       value={offDuty.toLocaleString('en-US')} icon={Users} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث باسم، هوية، جوال، أو ناقل..."
                className="pe-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                <SelectItem value="AVAILABLE">متاح</SelectItem>
                <SelectItem value="ON_TRIP">في رحلة</SelectItem>
                <SelectItem value="OFF_DUTY">خارج الخدمة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>السائق</TableHead>
                <TableHead>الناقل</TableHead>
                <TableHead>هوية</TableHead>
                <TableHead>فئة الرخصة</TableHead>
                <TableHead>صلاحية الرخصة</TableHead>
                <TableHead>الرحلات</TableHead>
                <TableHead>الجوال</TableHead>
                <TableHead>الطلب الحالي</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    لا توجد نتائج
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => {
                  const fullName = `${d.user.firstName} ${d.user.lastName}`;
                  const initials = fullName.trim().split(' ').slice(0, 2).map((w) => w[0] ?? '').join('');
                  const activeOrder = d.orderDrivers[0]?.order ?? null;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{fullName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{d.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/companies/${d.company.id}`} className="hover:text-primary text-sm">
                          {d.company.nameAr}
                        </Link>
                      </TableCell>
                      <TableCell className="num text-xs">{d.user.nationalId ?? '—'}</TableCell>
                      <TableCell className="text-xs">{d.licenseType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(d.licenseExpiry, 'd MMM yyyy')}</TableCell>
                      <TableCell className="num text-sm">{d.totalTrips.toLocaleString('en-US')}</TableCell>
                      <TableCell>
                        <a href={`tel:${d.user.phone}`} className="text-xs num inline-flex items-center gap-1 hover:text-primary" dir="ltr">
                          <Phone className="h-3 w-3" /> {d.user.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        {activeOrder ? (
                          <Link href={`/orders/${activeOrder.id}`} className="group">
                            <div className="text-xs font-mono text-primary hover:underline">{activeOrder.orderNumber}</div>
                            <div className="text-xs text-muted-foreground">{activeOrder.originCity} ← {activeOrder.destinationCity}</div>
                            <Badge variant="secondary" className="mt-0.5 h-4 text-[10px]">
                              <StatusBadge status={activeOrder.status} />
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
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
