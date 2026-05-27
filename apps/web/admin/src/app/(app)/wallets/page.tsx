'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Wallet } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Currency } from '@/components/currency';
import { COMPANIES, WALLETS, companyById, formatRelative } from '@naqla/shared-utils';

export default function AdminWalletsPage() {
  const [kind, setKind] = useState<'ALL' | 'CLIENT' | 'CARRIER'>('ALL');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    let arr = WALLETS.map((w) => ({ wallet: w, company: companyById(w.companyId)! })).filter((r) => r.company);
    if (kind !== 'ALL') arr = arr.filter((r) => r.company.kind === kind);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((r) =>
        r.company.nameAr.includes(search) ||
        r.company.crNumber.includes(search) ||
        r.company.nameEn.toLowerCase().includes(q),
      );
    }
    return arr;
  }, [kind, search]);

  const totalBalance = WALLETS.reduce((s, w) => s + w.balance, 0);
  const totalEscrow  = WALLETS.reduce((s, w) => s + w.escrowHeld, 0);

  return (
    <>
      <PageHeader
        title="محافظ الشركات"
        subtitle={`${WALLETS.length} محفظة · إجمالي الأرصدة في النظام`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الأرصدة الفعّالة</p>
              <p className="text-2xl font-bold tracking-tight mt-1.5 num">{totalBalance.toLocaleString('en-US')}<span className="text-base text-muted-foreground ms-1.5">ر.س.</span></p>
              <p className="text-xs text-muted-foreground mt-1">عبر {WALLETS.length} محفظة</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">محجوز في Escrow</p>
              <p className="text-2xl font-bold tracking-tight mt-1.5 num">{totalEscrow.toLocaleString('en-US')}<span className="text-base text-muted-foreground ms-1.5">ر.س.</span></p>
              <p className="text-xs text-muted-foreground mt-1">بانتظار التسليم والإفراج</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Tabs value={kind} onValueChange={(v) => setKind(v as any)}>
          <TabsList>
            <TabsTrigger value="ALL">الكل ({WALLETS.length})</TabsTrigger>
            <TabsTrigger value="CLIENT">العملاء ({WALLETS.filter((w) => companyById(w.companyId)?.kind === 'CLIENT').length})</TabsTrigger>
            <TabsTrigger value="CARRIER">المزودون ({WALLETS.filter((w) => companyById(w.companyId)?.kind === 'CARRIER').length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث باسم الشركة أو السجل..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشركة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead className="text-end">الرصيد المتاح</TableHead>
                <TableHead className="text-end">محجوز Escrow</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead className="text-end"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ wallet, company }) => (
                <TableRow key={wallet.id} className="cursor-pointer" onClick={() => (window.location.href = `/wallets/${company.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{company.nameAr.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{company.nameAr}</div>
                        <div className="text-xs font-mono text-muted-foreground">{wallet.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.kind === 'CLIENT' ? 'default' : 'success'}>
                      {company.kind === 'CLIENT' ? 'عميل' : 'مزوّد'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end"><Currency amount={wallet.balance} /></TableCell>
                  <TableCell className="text-end">
                    {wallet.escrowHeld > 0 ? <Currency amount={wallet.escrowHeld} /> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatRelative(wallet.updatedAt)}</TableCell>
                  <TableCell className="text-end">
                    <Link href={`/wallets/${company.id}`}>
                      <Button variant="ghost" size="sm">
                        إدارة المحفظة
                        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
