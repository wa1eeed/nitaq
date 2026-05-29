'use client';
import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import {
  AlertCircle, AlertTriangle, CheckCircle2, FileCheck2, FileText, Upload, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { fetcher, api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import {
  CARRIER_DOCS, CURRENT_CARRIER_ID, carrierDocsFor, formatDate,
  type CarrierDoc, type DocStatus,
} from '@naqla/shared-utils';
import { notify } from '@/lib/notify';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiDocStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type ApiDoc = {
  id: string;
  type: string;
  fileUrl: string;
  status: ApiDocStatus;
  reviewNotes?: string;
  reviewedAt?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_LABELS: Record<string, string> = {
  COMMERCIAL_REGISTER: 'السجل التجاري',
  VAT:                 'شهادة الضريبة (VAT)',
  ZAKAT:               'شهادة الزكاة والدخل',
  TRANSPORT_LICENSE:   'رخصة نقل البضائع',
  INSURANCE:           'بوليصة التأمين',
  BANK_LETTER:         'خطاب البنك (IBAN)',
};

const ALL_DOC_TYPES = Object.keys(DOC_LABELS) as (keyof typeof DOC_LABELS)[];

type DisplayStatus = DocStatus;

type DisplayDoc = {
  id: string;
  type: string;
  status: DisplayStatus;
  fileUrl?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  // mock fallback fields
  number?: string;
  issuedAt?: string | Date;
  expiresAt?: string | Date;
  fileName?: string;
};

const STATUS_META: Record<DisplayStatus, {
  label: string;
  tone: 'success' | 'warning' | 'destructive';
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
}> = {
  VALID:          { label: 'سارية',           tone: 'success',     icon: CheckCircle2,  bg: 'bg-success/10',     iconColor: 'text-success' },
  EXPIRING_SOON:  { label: 'قيد المراجعة',    tone: 'warning',     icon: AlertTriangle, bg: 'bg-warning/10',     iconColor: 'text-warning' },
  EXPIRED:        { label: 'مرفوضة',          tone: 'destructive', icon: AlertCircle,   bg: 'bg-destructive/10', iconColor: 'text-destructive' },
  MISSING:        { label: 'غير مرفقة',       tone: 'destructive', icon: AlertCircle,   bg: 'bg-destructive/10', iconColor: 'text-destructive' },
};

function apiStatusToDisplay(s: ApiDocStatus): DisplayStatus {
  if (s === 'APPROVED') return 'VALID';
  if (s === 'PENDING')  return 'EXPIRING_SOON';
  return 'EXPIRED'; // REJECTED
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CarrierDocumentsPage() {
  const companyId = useAuthStore((s) => s.user?.companyId);
  const kycKey = companyId ? `/companies/${companyId}/kyc` : null;

  const { data: apiDocs, isLoading: kycLoading } = useSWR<ApiDoc[]>(kycKey, fetcher);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<string>('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // ─── Build display docs list ───────────────────────────────────────────────

  // Try to use the mock fallback only when the API hasn't responded yet or errored
  const mockDocs = carrierDocsFor(CURRENT_CARRIER_ID);
  const mockByType = new Map(mockDocs.map((d) => [d.type, d]));

  let display: DisplayDoc[];

  if (apiDocs && Array.isArray(apiDocs)) {
    // API succeeded — map API docs
    const apiByType = new Map(apiDocs.map((d) => [d.type, d]));
    display = ALL_DOC_TYPES.map((type) => {
      const apiDoc = apiByType.get(type);
      if (apiDoc) {
        return {
          id: apiDoc.id,
          type: apiDoc.type,
          status: apiStatusToDisplay(apiDoc.status),
          fileUrl: apiDoc.fileUrl,
          reviewNotes: apiDoc.reviewNotes,
          reviewedAt: apiDoc.reviewedAt,
        };
      }
      return {
        id: `missing-${type}`,
        type,
        status: 'MISSING' as DisplayStatus,
      };
    });
  } else {
    // Fallback to mock data if API is unreachable
    display = ALL_DOC_TYPES.map((t) => {
      const mockDoc = mockByType.get(t as CarrierDoc['type']);
      if (mockDoc) {
        return {
          id: mockDoc.id,
          type: mockDoc.type,
          status: mockDoc.status as DisplayStatus,
          number: mockDoc.number,
          issuedAt: mockDoc.issuedAt,
          expiresAt: mockDoc.expiresAt,
          fileName: mockDoc.fileName,
        };
      }
      return {
        id: `missing-${t}`,
        type: t,
        status: 'MISSING' as DisplayStatus,
      };
    });
  }

  const stats = {
    total: ALL_DOC_TYPES.length,
    valid: display.filter((d) => d.status === 'VALID').length,
    expiring: display.filter((d) => d.status === 'EXPIRING_SOON').length,
    missing: display.filter((d) => d.status === 'MISSING' || d.status === 'EXPIRED').length,
  };

  const handleUpload = async () => {
    if (!companyId || !uploadType || !uploadUrl) return;
    setUploading(true);
    try {
      await api.post(`/companies/${companyId}/kyc`, {
        type: uploadType,
        fileUrl: uploadUrl,
      });
      notify.success('تم رفع الوثيقة', 'ستُراجع من قِبل الفريق قريباً');
      await globalMutate(kycKey);
      setUploadOpen(false);
      setUploadType('');
      setUploadUrl('');
    } catch (err: unknown) {
      notify.error(err, 'فشل رفع الوثيقة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="الوثائق والامتثال"
        subtitle="إدارة المستندات الرسمية المطلوبة لاستمرار النشاط على المنصة"
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> رفع وثيقة
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="إجمالي الوثائق" value={stats.total} icon={FileCheck2} />
        <StatsCard label="سارية" value={stats.valid} icon={CheckCircle2} tone="success" />
        <StatsCard label="قيد المراجعة" value={stats.expiring} icon={AlertTriangle} tone="warning" />
        <StatsCard label="مفقودة/مرفوضة" value={stats.missing} icon={AlertCircle} tone={stats.missing > 0 ? 'danger' : 'success'} />
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

      {kycLoading && !apiDocs && (
        <div className="text-center py-8 text-sm text-muted-foreground">جارٍ تحميل الوثائق…</div>
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
                      <CardTitle className="text-base truncate">{DOC_LABELS[d.type] ?? d.type}</CardTitle>
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
                      {d.reviewNotes && (
                        <div className="flex flex-col gap-0.5 pt-2 border-t">
                          <dt className="text-muted-foreground">ملاحظات المراجع</dt>
                          <dd className="text-xs text-muted-foreground">{d.reviewNotes}</dd>
                        </div>
                      )}
                      {d.fileUrl && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <dt className="text-muted-foreground inline-flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" /> الملف
                          </dt>
                          <dd className="text-xs font-mono truncate max-w-[180px]" dir="ltr">{d.fileUrl}</dd>
                        </div>
                      )}
                      {d.fileName && !d.fileUrl && (
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setUploadType(d.type);
                      setUploadOpen(true);
                    }}
                  >
                    {d.status === 'MISSING' ? 'رفع الآن' : 'استبدال'}
                  </Button>
                  {(d.fileUrl || d.fileName) && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={d.fileUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3.5 w-3.5" /> عرض
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Upload dialog ──────────────────────────────────────────────────── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفع وثيقة جديدة</DialogTitle>
            <DialogDescription>اختر نوع الوثيقة وأدخل رابط الملف أو ارفعه.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نوع الوثيقة</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوثيقة…" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{DOC_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رابط الملف (URL)</Label>
              <Input
                dir="ltr"
                placeholder="https://…"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                ارفع الملف على أي خدمة تخزين وأدخل الرابط هنا.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); setUploadType(''); setUploadUrl(''); }}>
              <X className="h-4 w-4" /> إلغاء
            </Button>
            <Button
              disabled={!uploadType || !uploadUrl || uploading}
              onClick={handleUpload}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'جارٍ الرفع…' : 'رفع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
