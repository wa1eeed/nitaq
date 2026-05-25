'use client';
import { useState } from 'react';
import { Copy, Megaphone, Pause, Play, Plus, Tag, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import {
  PROMOTIONS, formatDate, type Promotion, type PromoStatus,
} from '@naqla/shared-utils';

const STATUS_BADGE: Record<PromoStatus, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  ACTIVE: 'success', PAUSED: 'warning', EXPIRED: 'outline', DRAFT: 'default',
};
const STATUS_LABEL: Record<PromoStatus, string> = {
  ACTIVE: 'فعّال', PAUSED: 'متوقّف', EXPIRED: 'منتهٍ', DRAFT: 'مسودّة',
};
const KIND_LABEL: Record<Promotion['kind'], string> = {
  PERCENTAGE_OFF: 'نسبة خصم',
  FIXED_AMOUNT: 'مبلغ ثابت',
  COMMISSION_WAIVER: 'إعفاء عمولة',
};
const AUDIENCE_LABEL: Record<Promotion['audience'], string> = {
  CLIENT: 'العملاء', CARRIER: 'الناقلون', ALL: 'الجميع',
};

export default function PromotionsPage() {
  const [items] = useState<Promotion[]>(PROMOTIONS);

  const active   = items.filter((p) => p.status === 'ACTIVE').length;
  const totalUse = items.reduce((s, p) => s + p.usageCount, 0);
  const drafts   = items.filter((p) => p.status === 'DRAFT').length;

  const copy = (code: string) => {
    if (typeof navigator !== 'undefined') navigator.clipboard?.writeText(code);
  };

  return (
    <>
      <PageHeader
        title="الترويج والعروض"
        subtitle="إدارة أكواد الخصم والحملات الترويجية للعملاء والناقلين"
        actions={
          <Button>
            <Plus className="h-4 w-4" /> حملة جديدة
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="إجمالي الحملات" value={items.length} icon={Megaphone} />
        <StatsCard label="فعّالة" value={active} icon={Play} tone="success" />
        <StatsCard label="إجمالي الاستخدامات" value={totalUse.toLocaleString('en-US')} icon={Tag} />
        <StatsCard label="مسودّات" value={drafts} icon={Pause} tone="warning" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الجمهور</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>الاستخدام</TableHead>
                <TableHead>السريان</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <button
                      onClick={() => copy(p.code)}
                      className="inline-flex items-center gap-2 font-mono text-sm bg-muted px-2 py-1 rounded hover:bg-muted/60"
                      title="نسخ"
                    >
                      {p.code}
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <div className="text-sm truncate">{p.description}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{AUDIENCE_LABEL[p.audience]}</Badge></TableCell>
                  <TableCell className="text-xs">{KIND_LABEL[p.kind]}</TableCell>
                  <TableCell className="num font-medium">
                    {p.kind === 'PERCENTAGE_OFF' ? `${p.value}%` :
                     p.kind === 'FIXED_AMOUNT'   ? `${p.value} ر.س` :
                     'إعفاء كامل'}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="num font-medium">{p.usageCount.toLocaleString('en-US')}</span>
                      {p.usageLimit && (
                        <span className="text-muted-foreground"> / {p.usageLimit.toLocaleString('en-US')}</span>
                      )}
                    </div>
                    {p.usageLimit && (
                      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden w-16">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (p.usageCount / p.usageLimit) * 100)}%` }} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(p.startsAt, 'd MMM')} ← {formatDate(p.endsAt, 'd MMM yyyy')}
                  </TableCell>
                  <TableCell><Badge variant={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {p.status === 'ACTIVE' ? (
                        <Button size="sm" variant="ghost" title="إيقاف">
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                      ) : p.status === 'PAUSED' ? (
                        <Button size="sm" variant="ghost" title="تفعيل">
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" title="حذف" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
