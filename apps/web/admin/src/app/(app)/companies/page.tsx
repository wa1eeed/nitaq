'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Building2, Plus, Search, Truck, User as UserIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { COMPANIES, formatDate, type Company } from '@naqla/shared-utils';

export default function AdminCompaniesPage() {
  const [filter, setFilter] = useState<'ALL' | 'CLIENT' | 'CARRIER'>('ALL');
  const [search, setSearch] = useState('');

  // GET /admin/companies — falls back to mock COMPANIES array if API is down.
  const { data } = useSWR<unknown>('/admin/companies', fetcher);
  const list: Company[] = useMemo(() => {
    const arr =
      Array.isArray(data) ? data :
      Array.isArray((data as { items?: unknown[] })?.items) ? (data as { items: unknown[] }).items :
      [];
    return (arr.length > 0 ? arr : COMPANIES) as Company[];
  }, [data]);

  const counts = {
    ALL: list.length,
    CLIENT: list.filter((c) => c.kind === 'CLIENT').length,
    CARRIER: list.filter((c) => c.kind === 'CARRIER').length,
  };

  const rows = useMemo(() => {
    let arr = filter === 'ALL' ? list : list.filter((c) => c.kind === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((c) =>
        [c.nameAr, c.nameEn, c.crNumber, c.city].some((v) => v?.toString().toLowerCase().includes(q)),
      );
    }
    return arr;
  }, [list, filter, search]);

  return (
    <>
      <PageHeader
        title="الناقلون والعملاء"
        subtitle={`${list.length} كيان مسجّل — ${counts.CARRIER} ناقل (${list.filter((c) => c.kind === 'CARRIER' && c.accountType === 'INDIVIDUAL').length} فرد) · ${counts.CLIENT} عميل`}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            دعوة جديدة
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="ALL">
              <Building2 className="h-3.5 w-3.5 me-1.5" />
              الكل ({counts.ALL})
            </TabsTrigger>
            <TabsTrigger value="CLIENT">
              <Users className="h-3.5 w-3.5 me-1.5" />
              العملاء ({counts.CLIENT})
            </TabsTrigger>
            <TabsTrigger value="CARRIER">
              <Truck className="h-3.5 w-3.5 me-1.5" />
              الناقلون ({counts.CARRIER})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم، السجل، المدينة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشركة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead className="text-end">المؤشر</TableHead>
                <TableHead>الانضمام</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    لا توجد شركات تطابق البحث
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => (window.location.href = `/companies/${c.id}`)}>
                    <TableCell>
                      <Link href={`/companies/${c.id}`} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{c.nameAr.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium hover:text-primary transition-colors">{c.nameAr}</span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {c.accountType === 'INDIVIDUAL'
                              ? c.nationalId ? `هوية · ${c.nationalId}` : `معرّف · ${c.id}`
                              : c.crNumber ? `CR · ${c.crNumber}` : c.id}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={c.kind === 'CLIENT' ? 'default' : 'success'}>
                          {c.kind === 'CLIENT' ? 'عميل' : 'ناقل'}
                        </Badge>
                        {c.accountType === 'INDIVIDUAL' && (
                          <Badge variant="outline" className="inline-flex items-center gap-1 w-fit">
                            <UserIcon className="h-3 w-3" /> فرد
                          </Badge>
                        )}
                        {c.kind === 'CARRIER' && (c.accountType ?? 'COMPANY') === 'COMPANY' && (
                          <Badge variant="outline" className="inline-flex items-center gap-1 w-fit">
                            <Building2 className="h-3 w-3" /> شركة
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell><StatusBadge status={c.kycStatus} /></TableCell>
                    <TableCell className="text-end">
                      {c.kind === 'CARRIER' ? (
                        <span className="text-xs text-muted-foreground num">
                          {(c.completedTrips ?? 0).toLocaleString('en-US')} رحلة
                        </span>
                      ) : c.monthlyVolume ? (
                        <Currency amount={c.monthlyVolume} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.joinedAt)}</TableCell>
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
