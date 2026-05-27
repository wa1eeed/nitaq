'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Clock, FileText, Loader2,
  MessageSquare, Package, Scale, ShieldCheck, User, X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import { api, fetcher } from '@/lib/api';
import { notify } from '@/lib/notify';
import {
  DISPUTES, ORDERS, companyById, formatDate, formatDateTime, formatRelative,
  type Dispute,
} from '@naqla/shared-utils';

type ResolutionType = 'REFUND_CLIENT' | 'PAY_CARRIER' | 'SPLIT' | 'DISMISS';

const RESOLUTIONS: { value: ResolutionType; label: string; description: string; tone: string }[] = [
  { value: 'REFUND_CLIENT', label: 'استرداد كامل للعميل',  description: 'يُعاد المبلغ كاملاً وتُحمَّل الغرامة على المزوّد',    tone: 'text-info' },
  { value: 'PAY_CARRIER',   label: 'إفراج المبلغ للمزوّد', description: 'المزوّد محقّ — يُصرف المبلغ كما هو متّفق',            tone: 'text-success' },
  { value: 'SPLIT',         label: 'تقسيم 50/50',          description: 'يُقسَّم المبلغ بين الطرفين بالتساوي',                  tone: 'text-warning' },
  { value: 'DISMISS',       label: 'رفض النزاع',           description: 'لا يوجد أساس للنزاع، يستمر الإجراء الطبيعي',           tone: 'text-muted-foreground' },
];

export default function AdminDisputeDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // Live: fetch all admin disputes and pick the one matching the URL. Falls
  // back to the mock when the API doesn't return a match (offline demo mode).
  const { data, mutate } = useSWR<{ items?: Dispute[] } | Dispute[]>('/admin/disputes', fetcher);
  const all: Dispute[] = Array.isArray(data)
    ? data
    : ((data as { items?: Dispute[] } | undefined)?.items ?? []);
  const dispute = all.find((d) => d.id === params.id) ?? DISPUTES.find((d) => d.id === params.id);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState<ResolutionType | ''>('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Map our resolution UI labels to a single Arabic line for the backend's
  // `resolution` field. Backend stores resolution as free text + a status.
  const handleAssign = async () => {
    if (!dispute || !assignee || submitting) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/disputes/${dispute.id}`, {
        assignedTo: assignee,
        status: 'UNDER_REVIEW',
      });
      await mutate();
      notify.success('تم التعيين', `${assignee} يراجع النزاع الآن`);
      setAssignOpen(false);
      setAssignee('');
    } catch (err) {
      notify.error(err, 'فشل تعيين عضو الفريق');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!dispute || !resolution || !resolutionNote.trim() || submitting) return;
    setSubmitting(true);
    const label = RESOLUTIONS.find((r) => r.value === resolution)?.label ?? resolution;
    try {
      await api.put(`/admin/disputes/${dispute.id}`, {
        status: 'RESOLVED',
        resolution: `${label}\n\n${resolutionNote.trim()}`,
      });
      await mutate();
      notify.success('تم حل النزاع', label);
      setResolveOpen(false);
      setResolution('');
      setResolutionNote('');
    } catch (err) {
      notify.error(err, 'فشل حل النزاع');
    } finally {
      setSubmitting(false);
    }
  };

  if (!dispute) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Scale className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">النزاع غير موجود</h3>
          <Button onClick={() => router.push('/disputes')} className="mt-4">عودة للنزاعات</Button>
        </CardContent>
      </Card>
    );
  }

  const order = ORDERS.find((o) => o.id === dispute.orderId);
  const raiser = companyById(dispute.raisedById);
  const otherParty = order
    ? (dispute.raisedBy === 'CLIENT' ? companyById(order.carrierId) : companyById(order.clientId))
    : undefined;

  const initialsOf = (name?: string) => name?.split(' ').slice(0, 2).map((w) => w[0]).join('') ?? '?';

  return (
    <>
      <PageHeader
        title={`نزاع ${dispute.id}`}
        subtitle={`${dispute.reason} · ${formatRelative(dispute.createdAt)}`}
        actions={
          <>
            <StatusBadge status={dispute.status} />
            {dispute.status === 'OPEN' && (
              <Button onClick={() => setAssignOpen(true)}>
                <User className="h-4 w-4" /> تعيين فاحص
              </Button>
            )}
            {(dispute.status === 'UNDER_REVIEW' || dispute.status === 'OPEN') && (
              <Button onClick={() => setResolveOpen(true)}>
                <CheckCircle2 className="h-4 w-4" /> حلّ النزاع
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/disputes')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute summary */}
          <Card className="border-warning/30 bg-warning/[0.03]">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-warning/15 text-warning grid place-items-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle>{dispute.reason}</CardTitle>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="font-mono">{dispute.id}</span>
                    <span>· فُتح {formatDateTime(dispute.createdAt)}</span>
                    {dispute.resolvedAt && <span>· حُلّ {formatDateTime(dispute.resolvedAt)}</span>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-card border p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">وصف المشكلة</div>
                <p className="text-sm leading-relaxed">{dispute.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader><CardTitle>أطراف النزاع</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PartyCard
                title="المُنشئ"
                badge={dispute.raisedBy === 'CLIENT' ? 'عميل' : 'مزوّد'}
                badgeVariant="default"
                company={raiser}
                accent
              />
              <PartyCard
                title="الطرف الآخر"
                badge={dispute.raisedBy === 'CLIENT' ? 'مزوّد' : 'عميل'}
                badgeVariant="outline"
                company={otherParty}
              />
            </CardContent>
          </Card>

          {/* Conversation timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                سجل المراسلات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4">
                <span aria-hidden className="absolute top-2 bottom-2 start-3 w-px bg-border" />
                <TimelineEvent
                  who={raiser?.nameAr ?? '—'}
                  initials={initialsOf(raiser?.nameAr)}
                  at={dispute.createdAt}
                  text={`فتح النزاع. السبب: ${dispute.reason}`}
                  variant="raised"
                />
                <TimelineEvent
                  who="فهد العتيبي (الأدمن)"
                  initials="ف.ع"
                  at={dispute.createdAt}
                  text="تمّ استلام النزاع وسيُحال للمراجعة"
                  variant="system"
                />
                {dispute.status === 'UNDER_REVIEW' && (
                  <TimelineEvent
                    who="فهد العتيبي (الأدمن)"
                    initials="ف.ع"
                    at={dispute.createdAt}
                    text="بدأت مراجعة النزاع"
                    variant="system"
                  />
                )}
                {dispute.resolvedAt && (
                  <TimelineEvent
                    who="فهد العتيبي (الأدمن)"
                    initials="ف.ع"
                    at={dispute.resolvedAt}
                    text="تم إغلاق النزاع"
                    variant="system"
                  />
                )}
              </ol>

              {/* Reply input */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <Label>إضافة رد للطرفين</Label>
                <textarea
                  rows={3}
                  className="w-full p-3 rounded-md border bg-background text-sm"
                  placeholder="اكتب ردك..."
                />
                <Button size="sm">
                  <MessageSquare className="h-3.5 w-3.5" /> إرسال
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related order */}
          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  الطلب المرتبط
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link href={`/orders/${order.id}`} className="font-mono text-primary hover:underline block">
                  {order.orderNumber}
                </Link>
                <div className="text-xs text-muted-foreground">{order.originCity} ← {order.destinationCity}</div>
                <dl className="pt-2 border-t space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">القيمة</dt>
                    <dd className="font-medium"><Currency amount={order.agreedPrice ?? 0} /></dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">الحالة</dt>
                    <dd><StatusBadge status={order.status} /></dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">تاريخ الإنشاء</dt>
                    <dd className="text-xs">{formatDate(order.createdAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Resolution playbook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                خيارات الحل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setResolution(r.value); setResolveOpen(true); }}
                  className="w-full text-start p-3 rounded-md border hover:border-primary/40 hover:bg-muted/30 transition-colors"
                >
                  <div className={`font-medium text-sm ${r.tone}`}>{r.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* SLA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                مؤشّر الاستجابة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الوقت المنقضي</span>
                <span className="font-medium">{formatRelative(dispute.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SLA الموصى</span>
                <span className="font-medium">24 ساعة</span>
              </div>
              <div className="rounded-md bg-info/10 border border-info/30 p-2 text-xs flex items-start gap-2 mt-3">
                <AlertCircle className="h-3 w-3 text-info shrink-0 mt-0.5" />
                <span className="text-muted-foreground">يجب الرد خلال 24 ساعة لتجنّب تصعيد النزاع</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign reviewer dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعيين فاحص للنزاع</DialogTitle>
            <DialogDescription>اختر عضو فريق الامتثال المسؤول</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>الفاحص</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger><SelectValue placeholder="اختر عضو الفريق" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="فهد العتيبي">فهد العتيبي</SelectItem>
                <SelectItem value="سعد القحطاني">سعد القحطاني</SelectItem>
                <SelectItem value="منيرة الشمراني">منيرة الشمراني</SelectItem>
                <SelectItem value="نوف الزهراني">نوف الزهراني</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={submitting}>إلغاء</Button>
            <Button onClick={handleAssign} disabled={!assignee || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
              تعيين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve dispute dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حلّ النزاع {dispute.id}</DialogTitle>
            <DialogDescription>القرار سيؤثّر مباشرة على مبلغ Escrow وتقييمات الطرفين.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>القرار</Label>
              <Select value={resolution} onValueChange={(v) => setResolution(v as ResolutionType)}>
                <SelectTrigger><SelectValue placeholder="اختر القرار" /></SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {resolution && (
                <p className="text-xs text-muted-foreground">
                  {RESOLUTIONS.find((r) => r.value === resolution)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>ملاحظة القرار (تُرسل للطرفين)</Label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-md border bg-background text-sm leading-relaxed"
                placeholder="اشرح القرار وأسبابه..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)} disabled={submitting}>إلغاء</Button>
            <Button
              onClick={handleResolve}
              disabled={!resolution || !resolutionNote.trim() || submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              تأكيد القرار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PartyCard({
  title, badge, badgeVariant = 'outline', company, accent,
}: {
  title: string;
  badge: string;
  badgeVariant?: 'default' | 'outline';
  company?: ReturnType<typeof companyById>;
  accent?: boolean;
}) {
  const initials = company?.nameAr.split(' ').slice(0, 2).map((w) => w[0]).join('') ?? '?';
  return (
    <div className={`rounded-lg border p-4 ${accent ? 'border-primary/30 bg-primary/5' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase">{title}</div>
        <Badge variant={badgeVariant}>{badge}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{company?.nameAr ?? '—'}</div>
          <div className="text-xs text-muted-foreground font-mono">{company?.id}</div>
        </div>
      </div>
      {company && (
        <dl className="mt-3 pt-3 border-t space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">المدينة</dt>
            <dd>{company.city}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">الهاتف</dt>
            <dd className="num" dir="ltr">{company.contactPhone}</dd>
          </div>
          {company.rating != null && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">التقييم</dt>
              <dd className="num">⭐ {company.rating.toFixed(1)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function TimelineEvent({
  who, initials, at, text, variant,
}: {
  who: string; initials: string; at: string; text: string;
  variant: 'raised' | 'system' | 'reply';
}) {
  return (
    <li className="relative ps-10">
      <div className={`absolute start-0 top-0 h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold ${
        variant === 'system' ? 'bg-primary/10 text-primary' : 'bg-warning/15 text-warning'
      }`}>
        {initials}
      </div>
      <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
        <span className="text-sm font-medium">{who}</span>
        <span className="text-xs text-muted-foreground">{formatRelative(at)}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </li>
  );
}

// keep these imports useful even if not directly referenced
void X; void FileText;
