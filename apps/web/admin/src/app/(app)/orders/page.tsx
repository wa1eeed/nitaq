'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { ORDERS, companyById, formatDate, normalizeOrderList, SAUDI_CITIES, type Order } from '@naqla/shared-utils';

export default function AdminOrdersPage() {
  const [tab, setTab] = useState('ALL');
  const [city, setCity] = useState('ALL');
  const [search, setSearch] = useState('');

  // GET /admin/orders → all orders on the platform. Falls back to mock ORDERS
  // when the API is unreachable (the api.ts interceptor handles that).
  const { data } = useSWR<unknown>('/admin/orders', fetcher);
  const all: Order[] = useMemo(() => {
    const normalized = normalizeOrderList(data);
    return normalized.length > 0 ? normalized : ORDERS;
  }, [data]);

  const rows = useMemo(() => {
    let arr = all;
    if (tab !== 'ALL') arr = arr.filter((o) => o.status === tab);
    if (city !== 'ALL') arr = arr.filter((o) => o.originCity === city || o.destinationCity === city);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.cargoDescription.includes(search) ||
        o.originCity.includes(search) ||
        o.destinationCity.includes(search) ||
        (companyById(o.clientId)?.nameAr ?? '').includes(search),
      );
    }
    return arr;
  }, [all, tab, city, search]);

  const TABS = [
    { key: 'ALL',        label: 'الكل' },
    { key: 'PUBLISHED',  label: 'منشور' },
    { key: 'BIDDING',    label: 'قيد العروض' },
    { key: 'IN_TRANSIT', label: 'في الطريق' },
    { key: 'COMPLETED',  label: 'مكتمل' },
    { key: 'CANCELLED',  label: 'ملغى' },
  ];

  return (
    <>
      <PageHeader title="الطلبات" subtitle={`${all.length} طلب على المنصة`} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
                {' '}
                <Badge variant="secondary" className="ms-1 num">
                  {t.key === 'ALL' ? ORDERS.length : ORDERS.filter((o) => o.status === t.key).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="كل المدن" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل المدن</SelectItem>
              {SAUDI_CITIES.slice(0, 20).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative w-full md:w-80">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>الناقل</TableHead>
                <TableHead>المسار</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">عروض</TableHead>
                <TableHead className="text-end">المبلغ</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10">لا توجد طلبات</TableCell>
                </TableRow>
              ) : (
                rows.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => (window.location.href = `/orders/${o.id}`)}>
                    <TableCell>
                      <Link href={`/orders/${o.id}`} className="font-mono text-xs text-primary hover:underline">
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{companyById(o.clientId)?.nameAr ?? '—'}</TableCell>
                    <TableCell>{companyById(o.carrierId)?.nameAr ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{o.originCity} ← {o.destinationCity}</TableCell>
                    <TableCell>
                      <Badge variant={o.mode === 'DIRECT' ? 'warning' : 'secondary'}>
                        {o.mode === 'OPEN' ? 'مفتوح' : 'مباشر'}
                      </Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-center num">{o.bidCount || '—'}</TableCell>
                    <TableCell className="text-end"><Currency amount={o.agreedPrice ?? o.clientBudget} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
