'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Download, FileSpreadsheet,
  ShieldCheck, Wallet, RotateCcw,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Currency } from '@/components/currency';
import { exportPDF, exportXLSX } from '@/lib/export';
import { notify } from '@/lib/notify';
import { api } from '@/lib/api';
import {
  COMPANIES, companyById, formatDate, transactionsForCompany, walletForCompany,
  type TxKind, type WalletTransaction,
} from '@naqla/shared-utils';

const TX_LABEL: Record<TxKind, string> = {
  CREDIT:           'إيداع',
  DEBIT:            'خصم',
  ESCROW_HOLD:      'حجز Escrow',
  ESCROW_RELEASE:   'إفراج Escrow',
  REFUND:           'استرداد للعميل',
  COMMISSION:       'عمولة المنصة',
  PAYOUT:           'تحويل بنكي',
};

const TX_DIRECTION: Record<TxKind, 'in' | 'out'> = {
  CREDIT:         'in',
  DEBIT:          'out',
  ESCROW_HOLD:    'out',
  ESCROW_RELEASE: 'in',
  REFUND:         'in',
  COMMISSION:     'out',
  PAYOUT:         'out',
};

export default function AdminWalletDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const company = companyById(params.id);
  const wallet = company ? walletForCompany(company.id) : undefined;
  const txs = company ? transactionsForCompany(company.id) : [];

  // Dialog state
  const [open, setOpen] = useState(false);
  const [txKind, setTxKind] = useState<TxKind>('CREDIT');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!company || !wallet) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">المحفظة غير موجودة</h3>
          <Button onClick={() => router.push('/wallets')} className="mt-4">عودة</Button>
        </CardContent>
      </Card>
    );
  }

  const totalCredit = txs.filter((tx) => TX_DIRECTION[tx.kind] === 'in').reduce((s, tx) => s + tx.amount, 0);
  const totalDebit  = txs.filter((tx) => TX_DIRECTION[tx.kind] === 'out').reduce((s, tx) => s + tx.amount, 0);

  const exportColumns = [
    { key: 'at',           label: 'التاريخ',     format: (r: WalletTransaction) => formatDate(r.at, 'd MMM yyyy · HH:mm') },
    { key: 'id',           label: 'المعرّف' },
    { key: 'kind',         label: 'النوع',       format: (r: WalletTransaction) => TX_LABEL[r.kind] },
    { key: 'description',  label: 'الوصف' },
    { key: 'amount',       label: 'المبلغ',      format: (r: WalletTransaction) => (TX_DIRECTION[r.kind] === 'in' ? '+ ' : '- ') + r.amount.toLocaleString('en-US') },
    { key: 'balanceAfter', label: 'الرصيد بعد',  format: (r: WalletTransaction) => r.balanceAfter.toLocaleString('en-US') },
  ];

  const handleExportPDF = () => {
    exportPDF({
      filename: `wallet-${company.id}-${Date.now()}.pdf`,
      header: { brand: 'Nitaq', subtitle: company.nameEn, reportTitle: 'Statement of Account' },
      footer: {
        openingBalance: txs[txs.length - 1]?.balanceAfter ?? 0,
        closingBalance: wallet.balance,
        totalCredit,
        totalDebit,
      },
      columns: exportColumns as any,
      rows: txs,
    });
  };

  const handleExportXLSX = () => {
    exportXLSX({
      filename: `wallet-${company.id}-${Date.now()}.xlsx`,
      sheetName: 'Statement',
      columns: exportColumns as any,
      rows: txs,
    });
  };

  const handleSubmit = async () => {
    if (submitting || !amount || !description) return;
    const kind = txKind === 'CREDIT' ? 'CREDIT' : txKind === 'DEBIT' ? 'DEBIT' : 'ADJUSTMENT';
    setSubmitting(true);
    try {
      await api.post(`/admin/wallets/${company.id}/transactions`, {
        kind,
        amount: Number(amount),
        description,
        note: note || undefined,
      });
      notify.success('تم تسجيل المعاملة', `${kind === 'CREDIT' ? 'إيداع' : 'خصم'} ${Number(amount).toLocaleString('en-US')} ر.س`);
      setOpen(false);
      setAmount('');
      setNote('');
      setDescription('');
    } catch (err) {
      notify.error(err, 'فشل تسجيل المعاملة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={`محفظة ${company.nameAr}`}
        subtitle={`${wallet.id} · آخر تحديث ${formatDate(wallet.updatedAt, 'd MMM · HH:mm')}`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/wallets')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      {/* Big balance card */}
      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{company.nameAr.split(' ').slice(0, 2).map((w) => w[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Badge variant={company.kind === 'CLIENT' ? 'default' : 'success'} className="mb-2">
              {company.kind === 'CLIENT' ? 'عميل' : 'مزوّد'}
            </Badge>
            <div className="text-sm text-muted-foreground">الرصيد المتاح</div>
            <div className="mt-1 text-4xl font-bold tracking-tight num">
              {wallet.balance.toLocaleString('en-US')}
              <span className="text-xl text-muted-foreground ms-2">ر.س.</span>
            </div>
            {wallet.escrowHeld > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-warning" />
                محجوز في Escrow: <span className="num font-medium text-foreground">{wallet.escrowHeld.toLocaleString('en-US')}</span> ر.س.
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Wallet className="h-4 w-4" />
                  إجراء معاملة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إجراء معاملة على المحفظة</DialogTitle>
                  <DialogDescription>سجّل عملية على محفظة {company.nameAr}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>النوع</Label>
                    <Select value={txKind} onValueChange={(v) => setTxKind(v as TxKind)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREDIT">إيداع (Credit)</SelectItem>
                        <SelectItem value="DEBIT">خصم (Debit)</SelectItem>
                        <SelectItem value="ESCROW_RELEASE">إفراج للمزوّد</SelectItem>
                        <SelectItem value="REFUND">استرداد للعميل</SelectItem>
                        <SelectItem value="COMMISSION">عمولة المنصة</SelectItem>
                        <SelectItem value="PAYOUT">تحويل بنكي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ (ر.س.)</Label>
                    <Input id="amount" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: إيداع رصيد إضافي" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">ملاحظة (اختياري)</Label>
                    <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظات داخلية..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={!amount || !description}>تأكيد المعاملة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportXLSX}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryStat icon={ArrowDownLeft} tone="success" label="إجمالي الإيداعات" value={totalCredit} />
        <SummaryStat icon={ArrowUpRight}   tone="danger"  label="إجمالي الخصومات" value={totalDebit} />
        <SummaryStat icon={RotateCcw}      tone="default" label="عدد المعاملات"   value={txs.length} suffix=" معاملة" />
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle>كشف الحساب</CardTitle>
          <CardDescription className="mt-1">{txs.length} معاملة منذ افتتاح المحفظة</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>المعرّف</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead className="text-end">المبلغ</TableHead>
                <TableHead className="text-end">الرصيد بعد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">لا توجد معاملات</TableCell></TableRow>
              ) : (
                txs.map((tx) => {
                  const dir = TX_DIRECTION[tx.kind];
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(tx.at, 'd MMM · HH:mm')}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                      <TableCell>
                        <Badge variant={dir === 'in' ? 'success' : 'destructive'}>{TX_LABEL[tx.kind]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{tx.description}</div>
                        {tx.note && <div className="text-xs text-muted-foreground mt-0.5">{tx.note}</div>}
                      </TableCell>
                      <TableCell className={`text-end font-medium num ${dir === 'in' ? 'text-success' : 'text-destructive'}`}>
                        {dir === 'in' ? '+ ' : '- '}{tx.amount.toLocaleString('en-US')}
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
    </>
  );
}

function SummaryStat({ icon: Icon, tone, label, value, suffix }: { icon: any; tone: 'success' | 'danger' | 'default'; label: string; value: number; suffix?: string }) {
  const TONES = { success: 'bg-success/15 text-success', danger: 'bg-destructive/15 text-destructive', default: 'bg-primary/10 text-primary' };
  return (
    <Card>
      <CardContent className="pt-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight mt-1.5 num">
            {value.toLocaleString('en-US')}
            <span className="text-sm text-muted-foreground ms-1.5">{suffix ?? 'ر.س.'}</span>
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
