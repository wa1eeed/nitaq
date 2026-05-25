'use client';
import {
  AlertCircle, AlertTriangle, CheckCircle2, FileCheck2, FileText, Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import {
  CARRIER_DOCS, CURRENT_CARRIER_ID, carrierDocsFor, formatDate,
  type CarrierDoc, type DocStatus,
} from '@naqla/shared-utils';

const DOC_LABELS: Record<CarrierDoc['type'], string> = {
  COMMERCIAL_REGISTER: 'السجل التجاري',
  VAT:                 'شهادة الضريبة (VAT)',
  ZAKAT:               'شهادة الزكاة والدخل',
  TRANSPORT_LICENSE:   'رخصة نقل البضائع',
  INSURANCE:           'بوليصة التأمين',
  BANK_LETTER:         'خطاب البنك (IBAN)',
};

const STATUS_META: Record<DocStatus, { label: string; tone: 'success' | 'warning' | 'destructive'; icon: any; bg: string; iconColor: string }> = {
  VALID:          { label: 'سارية',           tone: 'success',     icon: CheckCircle2,  bg: 'bg-success/10',     iconColor: 'text-success' },
  EXPIRING_SOON:  { label: 'تنتهي قريباً',    tone: 'warning',     icon: AlertTriangle, bg: 'bg-warning/10',     iconColor: 'text-warning' },
  EXPIRED:        { label: 'منتهية',           tone: 'destructive', icon: AlertCircle,   bg: 'bg-destructive/10', iconColor: 'text-destructive' },
  MISSING:        { label: 'غير مرفقة',       tone: 'destructive', icon: AlertCircle,   bg: 'bg-destructive/10', iconColor: 'text-destructive' },
};

export default function CarrierDocumentsPage() {
  const docs = carrierDocsFor(CURRENT_CARRIER_ID);
  const docsByType = new Map(docs.map((d) => [d.type, d]));

  // Show all required document types even if missing
  const allTypes: CarrierDoc['type'][] = ['COMMERCIAL_REGISTER', 'VAT', 'ZAKAT', 'TRANSPORT_LICENSE', 'INSURANCE', 'BANK_LETTER'];
  const display = allTypes.map((t) => docsByType.get(t) ?? {
    id: `missing-${t}`,
    carrierId: CURRENT_CARRIER_ID,
    type: t,
    status: 'MISSING' as DocStatus,
  } as CarrierDoc);

  const stats = {
    total: allTypes.length,
    valid: display.filter((d) => d.status === 'VALID').length,
    expiring: display.filter((d) => d.status === 'EXPIRING_SOON').length,
    missing: display.filter((d) => d.status === 'MISSING' || d.status === 'EXPIRED').length,
  };

  return (
    <>
      <PageHeader
        title="الوثائق والامتثال"
        subtitle="إدارة المستندات الرسمية المطلوبة لاستمرار النشاط على المنصة"
        actions={
          <Button>
            <Upload className="h-4 w-4" /> رفع وثيقة
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="إجمالي الوثائق" value={stats.total} icon={FileCheck2} />
        <StatsCard label="سارية" value={stats.valid} icon={CheckCircle2} tone="success" />
        <StatsCard label="تنتهي قريباً" value={stats.expiring} icon={AlertTriangle} tone="warning" />
        <StatsCard label="مفقودة/منتهية" value={stats.missing} icon={AlertCircle} tone={stats.missing > 0 ? 'danger' : 'success'} />
      </div>

      {stats.missing > 0 && (
        <Card className="border-destructive/30 bg-destructive/[0.03] mb-6">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">يلزمك إكمال {stats.missing} مستند(ات)</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                قد يتم تقييد قدرتك على قبول طلبات جديدة حتى استكمال جميع المستندات الإلزامية.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {display.map((d) => {
          const meta = STATUS_META[d.status];
          const Icon = meta.icon;
          return (
            <Card key={d.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${meta.bg}`}>
                      <Icon className={`h-5 w-5 ${meta.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{DOC_LABELS[d.type]}</CardTitle>
                      {d.number && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">{d.number}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant={meta.tone}>{meta.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.status === 'MISSING' ? (
                  <div className="text-sm text-muted-foreground py-2">
                    لم تُرفع هذه الوثيقة بعد.
                  </div>
                ) : (
                  <>
                    <dl className="space-y-1.5 text-xs">
                      {d.issuedAt && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">تاريخ الإصدار</dt>
                          <dd className="font-medium">{formatDate(d.issuedAt)}</dd>
                        </div>
                      )}
                      {d.expiresAt && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">تاريخ الانتهاء</dt>
                          <dd className={`font-medium ${d.status === 'EXPIRING_SOON' ? 'text-warning' : ''}`}>
                            {formatDate(d.expiresAt)}
                          </dd>
                        </div>
                      )}
                      {d.fileName && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <dt className="text-muted-foreground inline-flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" /> الملف
                          </dt>
                          <dd className="text-xs font-mono truncate max-w-[180px]" dir="ltr">{d.fileName}</dd>
                        </div>
                      )}
                    </dl>
                  </>
                )}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1">
                    {d.status === 'MISSING' ? 'رفع الآن' : 'استبدال'}
                  </Button>
                  {d.fileName && (
                    <Button size="sm" variant="ghost">
                      <FileText className="h-3.5 w-3.5" /> عرض
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
