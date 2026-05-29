'use client';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  ArrowDownLeft, ArrowUpRight, Download, FileSpreadsheet, FileText, ShieldCheck, Wallet,
} from 'lucide-react';
import { fetcher } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Currency } from '@/components/currency';
import { PageTransition, FadeItem } from '@/components/page-transition';
import { StatusBadge } from '@/components/status-badge';
import { exportPDF, exportXLSX } from '@/lib/export';
import {
  CURRENT_CLIENT_ID, formatDate, invoicesForClient, transactionsForCompany,
  walletForCompany, type TxKind, type WalletTransaction,
} from '@naqla/shared-utils';

const TX_LABEL: Record<TxKind, string> = {
  CREDIT: 'إيداع', DEBIT: 'خصم', ESCROW_HOLD: 'حجز Escrow',
  ESCROW_RELEASE: 'إفراج Escrow', REFUND: 'استرداد', COMMISSION: 'عمولة', PAYOUT: 'تحويل بنكي',
};
const TX_IN: TxKind[] = ['CREDIT', 'ESCROW_RELEASE', 'REFUND'];

export default function ClientFinancePage() {
  const companyId = useAuthStore((s) => s.user?.companyId) ?? CURRENT_CLIENT_ID;
  const { data: txData } = useSWR<{ data: any[]; walletBalance?: number }>(`/companies/${companyId}/transactions?limit=100`, fetcher);
  const wallet = walletForCompany(companyId);
  const invoices = invoicesForClient(companyId);
  const apiTxs: WalletTransaction[] = (txData?.data ?? []).map((t: any) => ({
    id: t.id,
    walletId: t.companyId ?? '',
    at: t.createdAt,
    kind: (t.type as TxKind) ?? ('DEBIT' as TxKind),
    description: t.description ?? '',
    amount: t.amount,
    balanceAfter: t.balance ?? 0,
    note: t.reference ?? undefined,
  }));
  const txs = apiTxs.length > 0 ? apiTxs : transactionsForCompany(companyId);
  const effectiveBalance = txData?.walletBalance ?? wallet?.balance ?? 0;

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredTxs = useMemo(() => {
    let arr = txs;
    if (fromDate) arr = arr.filter((tx) => tx.at >= fromDate);
    if (toDate)   arr = arr.filter((tx) => tx.at <= toDate + 'T23:59:59Z');
    return arr;
  }, [txs, fromDate, toDate]);

  const totalCredit = filteredTxs.filter((tx) => TX_IN.includes(tx.kind)).reduce((s, tx) => s + tx.amount, 0);
  const totalDebit  = filteredTxs.filter((tx) => !TX_IN.includes(tx.kind)).reduce((s, tx) => s + tx.amount, 0);

  const exportColumns = [
    { key: 'at',           label: 'التاريخ',      format: (r: WalletTransaction) => formatDate(r.at, 'd MMM yyyy · HH:mm') },
    { key: 'kind',         label: 'النوع',        format: (r: WalletTransaction) => TX_LABEL[r.kind] },
    { key: 'description',  label: 'الوصف' },
    { key: 'amount',       label: 'المبلغ',       format: (r: WalletTransaction) => (TX_IN.includes(r.kind) ? '+ ' : '- ') + r.amount.toLocaleString('en-US') },
    { key: 'balanceAfter', label: 'الرصيد بعد',   format: (r: WalletTransaction) => r.balanceAfter.toLocaleString('en-US') },
  ];

  const handlePDF = () => exportPDF({
    filename: `statement-${Date.now()}.pdf`,
    header: { brand: 'Nitaq', subtitle: 'Client Statement', reportTitle: 'Statement of Account' },
    footer: { closingBalance: effectiveBalance, totalCredit, totalDebit },
    columns: exportColumns as any,
    rows: filteredTxs,
  });
  const handleXLSX = () => exportXLSX({ filename: `statement-${Date.now()}.xlsx`, columns: exportColumns as any, rows: filteredTxs });

  return (
    <PageTransition>
      <FadeItem>
        <PageHeader title="الشؤون المالية" subtitle="محفظتك، كشف الحساب، والفواتير" />
      </FadeItem>

      <FadeItem>
      <Tabs defaultValue="wallet">
        <TabsList>
          <TabsTrigger value="wallet">المحفظة</TabsTrigger>
          <TabsTrigger value="statement">كشف الحساب</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
        </TabsList>

        {/* Wallet */}
        <TabsContent value="wallet" className="space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col sm:flex-row items-start gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shrink-0">
                <Wallet className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">الرصيد المتاح</p>
                <p className="text-4xl font-bold tracking-tight mt-1 num">
                  {effectiveBalance.toLocaleString('en-US')}
                  <span className="text-xl text-muted-foreground ms-2">ر.س.</span>
                </p>
                {(wallet?.escrowHeld ?? 0) > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-sm">
                    <ShieldCheck className="h-4 w-4 text-warning" />
                    <span className="text-muted-foreground">محجوز في Escrow:</span>
                    <span className="num font-medium">{(wallet?.escrowHeld ?? 0).toLocaleString('en-US')}</span>
                    <span className="text-muted-foreground">ر.س.</span>
                  </div>
                )}
              </div>
              <Button>شحن المحفظة</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>آخر 5 معاملات</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead className="text-end">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs.slice(0, 5).map((tx) => {
                    const isIn = TX_IN.includes(tx.kind);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(tx.at, 'd MMM · HH:mm')}</TableCell>
                        <TableCell><Badge variant={isIn ? 'success' : 'destructive'}>{TX_LABEL[tx.kind]}</Badge></TableCell>
                        <TableCell className="text-sm">{tx.description}</TableCell>
                        <TableCell className={`text-end font-medium num ${isIn ? 'text-success' : 'text-destructive'}`}>
                          {isIn ? '+ ' : '- '}{tx.amount.toLocaleString('en-US')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statement */}
        <TabsContent value="statement" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle>كشف الحساب</CardTitle>
                  <CardDescription className="mt-1">جميع المعاملات على محفظتك</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handlePDF}>
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                  <Button variant="outline" onClick={handleXLSX}>
                    <FileSpreadsheet className="h-4 w-4" /> Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="from">من تاريخ</Label>
                  <Input id="from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">إلى تاريخ</Label>
                  <Input id="to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <StatMini icon={ArrowDownLeft} label="إجمالي الإيداعات" value={totalCredit} tone="success" />
                <StatMini icon={ArrowUpRight}   label="إجمالي الخصومات" value={totalDebit}  tone="danger" />
                <StatMini icon={Wallet}         label="الرصيد الحالي"   value={effectiveBalance} tone="default" />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead className="text-end">المبلغ</TableHead>
                    <TableHead className="text-end">الرصيد بعد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTxs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">لا توجد معاملات في هذه الفترة</TableCell></TableRow>
                  ) : (
                    filteredTxs.map((tx) => {
                      const isIn = TX_IN.includes(tx.kind);
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(tx.at, 'd MMM · HH:mm')}</TableCell>
                          <TableCell><Badge variant={isIn ? 'success' : 'destructive'}>{TX_LABEL[tx.kind]}</Badge></TableCell>
                          <TableCell className="text-sm">
                            <div>{tx.description}</div>
                            {tx.note && <div className="text-xs text-muted-foreground mt-0.5">{tx.note}</div>}
                          </TableCell>
                          <TableCell className={`text-end font-medium num ${isIn ? 'text-success' : 'text-destructive'}`}>
                            {isIn ? '+ ' : '- '}{tx.amount.toLocaleString('en-US')}
                          </TableCell>
                          <TableCell className="text-end num">{tx.balanceAfter.toLocaleString('en-US')}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader><CardTitle>فواتيري</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم</TableHead>
                    <TableHead>الطلب</TableHead>
                    <TableHead>الإصدار</TableHead>
                    <TableHead>الاستحقاق</TableHead>
                    <TableHead className="text-end">الإجمالي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-end"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs font-medium">{i.invoiceNumber}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{i.orderId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(i.issuedAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(i.dueAt)}</TableCell>
                      <TableCell className="text-end"><Currency amount={i.total} /></TableCell>
                      <TableCell><StatusBadge status={i.status} /></TableCell>
                      <TableCell className="text-end">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </FadeItem>
    </PageTransition>
  );
}

function StatMini({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: 'success' | 'danger' | 'default' }) {
  const TONES = { success: 'bg-success/15 text-success', danger: 'bg-destructive/15 text-destructive', default: 'bg-primary/10 text-primary' };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <div className={`flex h-9 w-9 items-center justify-center rounded-md shrink-0 ${TONES[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-bold num">{value.toLocaleString('en-US')} <span className="text-xs text-muted-foreground font-normal">ر.س.</span></div>
      </div>
    </div>
  );
}
