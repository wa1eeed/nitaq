'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight, Building2, Check, Clock, Crown, FileCheck, FileText, FileX, Mail,
  MapPin, MoreVertical, Phone, ShieldCheck, Trash2, Truck, Upload, Users, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Currency } from '@/components/currency';
import {
  COMPANIES, ORDERS, formatDate, teamMembersFor, permissionsFor,
  type CompanyRole, type TeamMember,
} from '@naqla/shared-utils';

export default function AdminCompanyDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const company = COMPANIES.find((c) => c.id === params.id);

  if (!company) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold">الشركة غير موجودة</h3>
          <Button onClick={() => router.push('/companies')} className="mt-4">عودة</Button>
        </CardContent>
      </Card>
    );
  }

  const orders = ORDERS.filter((o) =>
    company.kind === 'CLIENT' ? o.clientId === company.id : o.carrierId === company.id,
  );

  return (
    <>
      <PageHeader
        title={company.nameAr}
        subtitle={`${company.kind === 'CLIENT' ? 'عميل' : 'ناقل'} · ${company.city}`}
        actions={
          <>
            <StatusBadge status={company.kycStatus} />
            <Button variant="outline" onClick={() => router.push('/companies')}>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" /> رجوع
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details + KYC + orders */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="الاسم (عربي)" value={company.nameAr} />
                <Row label="Name (EN)" value={<span className="num">{company.nameEn}</span>} />
                <Row label="السجل التجاري" value={<span className="num">{company.crNumber}</span>} />
                <Row label="الرقم الضريبي" value={<span className="num">{company.vatNumber}</span>} />
                <Row label="المدينة" icon={MapPin} value={`${company.city} — ${company.region}`} />
                <Row label="البريد" icon={Mail} value={<span className="num">{company.contactEmail}</span>} />
                <Row label="الهاتف" icon={Phone} value={<span className="num" dir="ltr">{company.contactPhone}</span>} />
                <Row label="تاريخ التسجيل" value={formatDate(company.joinedAt, 'd MMMM yyyy')} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>مستندات التحقق (KYC)</CardTitle>
                  <CardDescription className="mt-1">المستندات اللازمة لاعتماد الشركة</CardDescription>
                </div>
                {company.kycStatus === 'PENDING_VERIFICATION' && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4" />
                      رفض
                    </Button>
                    <Button size="sm">
                      <ShieldCheck className="h-4 w-4" />
                      اعتماد
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <KycDocRow
                label="السجل التجاري"
                file={`CR-${company.crNumber}.pdf`}
                state={company.kycStatus === 'APPROVED' ? 'approved' : 'pending'}
              />
              <KycDocRow
                label="شهادة الزكاة والدخل"
                file="ZTC-2026.pdf"
                state={company.kycStatus === 'APPROVED' ? 'approved' : 'pending'}
              />
              <KycDocRow
                label="شهادة الضريبة (VAT)"
                file={`VAT-${company.vatNumber}.pdf`}
                state={company.kycStatus === 'APPROVED' ? 'approved' : 'pending'}
              />
              {company.kind === 'CARRIER' && (
                <KycDocRow
                  label="بوليصة التأمين"
                  file={company.insurance ? 'Insurance-2026.pdf' : undefined}
                  state={company.insurance ? 'approved' : 'missing'}
                />
              )}
            </CardContent>
          </Card>

          {/* Team — read-only with suspend/remove actions only (admin can't add) */}
          <AdminTeamSection companyId={company.id} companyKind={company.kind} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>طلبات هذه الشركة</CardTitle>
                <Badge variant="secondary">{orders.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">لا توجد طلبات</p>
              ) : (
                orders.slice(0, 5).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => router.push(`/orders/${o.id}`)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-start"
                  >
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{o.orderNumber}</span>
                    <span className="flex-1 text-sm truncate">{o.originCity} ← {o.destinationCity}</span>
                    <StatusBadge status={o.status} />
                    <Currency amount={o.agreedPrice ?? o.clientBudget} />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: performance / actions */}
        <div className="space-y-6">
          {company.kind === 'CARRIER' && (
            <Card>
              <CardHeader><CardTitle>أداء الناقل</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y">
                  <Row label="التقييم" value={<span className="num font-medium">{company.rating?.toFixed(1)} ⭐</span>} />
                  <Row label="رحلات منجزة" icon={Truck} value={<span className="num font-medium">{(company.completedTrips ?? 0).toLocaleString('en-US')}</span>} />
                  <Row label="حجم الأسطول" value={<span className="num font-medium">{company.fleetSize} شاحنة</span>} />
                  <Row label="متوسط الاستجابة" value={<span className="num font-medium">{company.responseTimeMins} دقيقة</span>} />
                  <Row label="تأمين شامل" value={<Badge variant={company.insurance ? 'success' : 'secondary'}>{company.insurance ? 'متوفر' : 'غير متوفر'}</Badge>} />
                </dl>
              </CardContent>
            </Card>
          )}

          {company.kind === 'CLIENT' && (
            <Card>
              <CardHeader><CardTitle>ملف العميل</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y">
                  <Row label="حجم النقل الشهري" value={<Currency amount={company.monthlyVolume ?? 0} />} />
                  <Row label="عدد الطلبات" value={<span className="num font-medium">{orders.length}</span>} />
                  <Row label="حالة الحساب" value={<Badge variant="success">نشط</Badge>} />
                </dl>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>إجراءات</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4" />
                طلب مستند إضافي
              </Button>
              <Button variant="outline" className="w-full justify-start">إرسال رسالة</Button>
              <Separator />
              <Button variant="destructive" className="w-full justify-start">إيقاف الحساب</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({
  label, value, icon: Icon,
}: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-sm font-medium text-foreground text-end shrink-0 max-w-[60%]">{value ?? '—'}</dd>
    </div>
  );
}

function KycDocRow({
  label, file, state,
}: { label: string; file?: string; state: 'pending' | 'approved' | 'rejected' | 'missing' }) {
  const META = {
    pending:  { bg: 'bg-warning/15 text-warning',         label: 'بانتظار', icon: Clock },
    approved: { bg: 'bg-success/15 text-success',         label: 'معتمد',   icon: FileCheck },
    rejected: { bg: 'bg-destructive/15 text-destructive', label: 'مرفوض',  icon: FileX },
    missing:  { bg: 'bg-muted text-muted-foreground',     label: 'لم يُرفع', icon: FileText },
  } as const;
  const m = META[state];
  const Icon = m.icon;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <div className="h-10 w-10 rounded-md bg-muted text-muted-foreground grid place-items-center shrink-0">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{label}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${m.bg}`}>
            <Icon className="h-3 w-3" />
            {m.label}
          </span>
        </div>
        {file && <p className="text-xs text-muted-foreground font-mono truncate">{file}</p>}
      </div>
      {state !== 'missing' && (
        <Button variant="ghost" size="sm">عرض</Button>
      )}
    </div>
  );
}

// ─── Admin Team section ──────────────────────────────────────────────
// Admin can VIEW the company's team and suspend/remove members, but cannot
// add new ones (per spec: that's the company's right).
function AdminTeamSection({ companyId, companyKind }: { companyId: string; companyKind: 'CLIENT' | 'CARRIER' }) {
  const [members, setMembers] = useState<TeamMember[]>(() => teamMembersFor(companyId));

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> الفريق</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">لا يوجد أعضاء بعد</CardContent>
      </Card>
    );
  }

  const roleLabels: Record<CompanyRole, string> = {
    OWNER: '👑 المالك',
    ADMIN: '👑 مدير',
    STAFF: '📦 مشرف عمليات',
    DISPATCH: '🚚 مشرف أسطول',
    FINANCE: '💰 محاسب',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> الفريق</CardTitle>
          <Badge variant="secondary">{members.length} عضو</Badge>
        </div>
        <CardDescription className="mt-1">
          الأدمن يمكنه عرض وإيقاف/حذف الأعضاء فقط. إضافة الأعضاء حق الشركة من إعداداتها.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {members.map((m, i) => {
          const initials = m.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('');
          const perms = permissionsFor(companyKind, m.role);
          return (
            <div key={m.id} className={`p-4 ${i < members.length - 1 ? 'border-b' : ''}`}>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{m.fullName}</span>
                    {m.isOwner && <Crown className="h-4 w-4 text-warning shrink-0" />}
                    {m.status === 'SUSPENDED' && <Badge variant="destructive" className="text-[10px]">موقوف</Badge>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="num" dir="ltr">{m.phone}</span>
                    {m.email && <span dir="ltr">· {m.email}</span>}
                    <span>· انضم {formatDate(m.addedAt)}</span>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">{roleLabels[m.role]}</Badge>
                {!m.isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {m.status === 'ACTIVE' ? (
                        <DropdownMenuItem onClick={() => setMembers((s) => s.map((x) => x.id === m.id ? { ...x, status: 'SUSPENDED' } : x))}>
                          <X className="h-3.5 w-3.5" /> إيقاف
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setMembers((s) => s.map((x) => x.id === m.id ? { ...x, status: 'ACTIVE' } : x))}>
                          <Check className="h-3.5 w-3.5" /> تنشيط
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => { if (confirm('حذف هذا العضو من الفريق؟')) setMembers((s) => s.filter((x) => x.id !== m.id)); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> حذف من الفريق
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {perms.can.slice(0, 4).map((p, k) => (
                  <div key={`y-${k}`} className="flex items-start gap-1.5 text-muted-foreground">
                    <Check className="h-3 w-3 text-success shrink-0 mt-0.5" /> {p}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
