'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Briefcase, Filter, Search } from 'lucide-react';
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

type ApiService = {
  id: string;
  serviceCode: string;
  type: string;
  capacity: number;
  isActive: boolean;
  status?: string;
  createdAt: string;
  company?: { id: string; nameAr: string };
  currentEmployee?: { user: { firstName: string; lastName: string } } | null;
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  CONSULTING:  'استشارات',
  DESIGN:      'تصميم',
  DEVELOPMENT: 'تطوير',
  MAINTENANCE: 'صيانة',
  CLEANING:    'تنظيف',
  SECURITY:    'أمن وحراسة',
  CATERING:    'تقديم طعام',
  OTHER:       'أخرى',
};

export default function AdminServicesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [type, setType] = useState<string>('ALL');

  const { data: raw } = useSWR<ApiService[] | { items?: ApiService[] }>('/services?limit=200', fetcher);
  const all: ApiService[] = useMemo(() => {
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (raw as { items?: ApiService[] }).items ?? [];
  }, [raw]);

  const filtered = useMemo(() => {
    return all.filter((s) => {
      if (status !== 'ALL') {
        const isActive = s.isActive !== false && s.status !== 'INACTIVE';
        if (status === 'ACTIVE' && !isActive) return false;
        if (status === 'INACTIVE' && isActive) return false;
      }
      if (type !== 'ALL' && s.type !== type) return false;
      if (q) {
        const hay = `${s.serviceCode} ${s.company?.nameAr ?? ''} ${SERVICE_TYPE_LABELS[s.type] ?? s.type}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [all, q, status, type]);

  const total    = all.length;
  const active   = all.filter((s) => s.isActive !== false && s.status !== 'INACTIVE').length;
  const assigned = all.filter((s) => !!s.currentEmployee).length;
  const inactive = all.filter((s) => s.isActive === false || s.status === 'INACTIVE').length;

  return (
    <>
      <PageHeader
        title="كل الخدمات في المنصة"
        subtitle="نظرة شاملة على خدمات جميع المزودين المسجّلين"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="إجمالي الخدمات"   value={total.toLocaleString('en-US')}    icon={Briefcase} />
        <StatsCard label="قيد التنفيذ"        value={assigned.toLocaleString('en-US')} icon={Briefcase} tone="warning" />
        <StatsCard label="متاحة"              value={active.toLocaleString('en-US')}   icon={Briefcase} tone="success" />
        <StatsCard label="موقوفة"             value={inactive.toLocaleString('en-US')} icon={Briefcase} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بكود الخدمة أو اسم المزوّد..."
                className="pe-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الحالات</SelectItem>
                <SelectItem value="ACTIVE">نشطة</SelectItem>
                <SelectItem value="INACTIVE">موقوفة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="كل الأنواع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل الأنواع</SelectItem>
                {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {all.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">لا توجد خدمات مسجّلة بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود الخدمة</TableHead>
                  <TableHead>المزوّد</TableHead>
                  <TableHead>نوع الخدمة</TableHead>
                  <TableHead>الطاقة الاستيعابية</TableHead>
                  <TableHead>الموظف المعيّن</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs text-primary">{s.serviceCode}</TableCell>
                      <TableCell>
                        {s.company ? (
                          <Link href={`/companies/${s.company.id}`} className="font-medium hover:text-primary">
                            {s.company.nameAr}
                          </Link>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {SERVICE_TYPE_LABELS[s.type] ?? s.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="num text-sm">{s.capacity.toLocaleString('en-US')}</TableCell>
                      <TableCell className="text-sm">
                        {s.currentEmployee
                          ? `${s.currentEmployee.user.firstName} ${s.currentEmployee.user.lastName}`
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={s.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
