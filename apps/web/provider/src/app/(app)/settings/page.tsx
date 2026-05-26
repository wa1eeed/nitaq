'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import {
  Building2, FileText, Loader2, Mail, MapPin, Phone, Settings, Star, Truck, Upload, Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { TeamTab } from '@/components/settings/team-tab';
import { useAuthStore } from '@/lib/auth-store';
import { fetcher, api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { formatDate } from '@naqla/shared-utils';

const KYC_TYPES = [
  { value: 'COMMERCIAL_REGISTER', label: 'السجل التجاري' },
  { value: 'TAX_CERTIFICATE', label: 'شهادة الضريبة' },
  { value: 'FREIGHT_LICENSE', label: 'رخصة نقل البضائع' },
  { value: 'INSURANCE_POLICY', label: 'بوليصة التأمين' },
  { value: 'BANK_LETTER', label: 'خطاب البنك (IBAN)' },
  { value: 'OTHER', label: 'وثيقة أخرى' },
] as const;

type KycDoc = {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  notes?: string | null;
  createdAt: string;
};

export default function CarrierSettingsPage() {
  const t = useTranslations('settings');
  const companyId = useAuthStore((s) => s.user?.companyId);

  const { data: company, mutate: mutateCompany } = useSWR<Record<string, unknown>>(
    companyId ? `/companies/${companyId}` : null,
    fetcher,
  );
  const { data: kycDocs, mutate: mutateKyc } = useSWR<KycDoc[]>(
    companyId ? `/companies/${companyId}/kyc` : null,
    fetcher,
  );
  const { data: stats } = useSWR<{ orders: number; completedRevenue: number; activeBids: number }>(
    companyId ? `/companies/${companyId}/stats` : null,
    fetcher,
  );

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', crNumber: '', vatNumber: '',
    city: '', region: '', contactPhone: '', contactEmail: '', website: '',
  });

  const openEdit = () => {
    if (!company) return;
    setForm({
      nameAr: (company.nameAr as string) ?? '',
      nameEn: (company.nameEn as string) ?? '',
      crNumber: (company.crNumber as string) ?? '',
      vatNumber: (company.vatNumber as string) ?? '',
      city: (company.city as string) ?? '',
      region: (company.region as string) ?? '',
      contactPhone: (company.contactPhone as string) ?? '',
      contactEmail: (company.contactEmail as string) ?? '',
      website: (company.website as string) ?? '',
    });
    setEditOpen(true);
  };

  const saveCompany = async () => {
    if (!companyId || saving) return;
    setSaving(true);
    try {
      await api.put(`/companies/${companyId}`, form);
      notify.success('تم حفظ بيانات الشركة');
      await mutateCompany();
      setEditOpen(false);
    } catch (err) {
      notify.error(err, 'فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  // KYC upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [kycDocType, setKycDocType] = useState<string>('COMMERCIAL_REGISTER');
  const [uploading, setUploading] = useState(false);

  const handleKycUpload = async (file: File) => {
    if (!companyId || uploading) return;
    setUploading(true);
    try {
      const presign = await api.post<{ uploadUrl: string; publicUrl: string }>(
        '/uploads/presign',
        { filename: file.name, contentType: file.type, folder: 'kyc', sizeBytes: file.size },
      );
      const { uploadUrl, publicUrl } = presign.data;
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await api.post(`/companies/${companyId}/kyc`, { type: kycDocType, fileUrl: publicUrl });
      notify.success('تم رفع الوثيقة', 'ستخضع للمراجعة من فريق التحقق');
      await mutateKyc();
    } catch (err) {
      notify.error(err, 'فشل رفع الوثيقة');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const kycStatus = (company?.kycStatus as string | undefined) ?? 'PENDING';

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company"><Building2 className="h-4 w-4 me-1.5" /> {t('tabs.company')}</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 me-1.5" /> {t('tabs.team')}</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 me-1.5" /> {t('tabs.settings')}</TabsTrigger>
          <TabsTrigger value="kyc"><FileText className="h-4 w-4 me-1.5" /> {t('tabs.kyc')}</TabsTrigger>
        </TabsList>

        {/* ─── Company Info ─── */}
        <TabsContent value="company">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('company.info')}</CardTitle>
                  <Badge variant={kycStatus === 'APPROVED' ? 'success' : 'warning'}>
                    {kycStatus === 'APPROVED' ? t('company.verifiedAccount') : t('company.awaitingVerification')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!company ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex justify-between py-3 border-b">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <dl className="divide-y">
                    <Row label={t('company.nameAr')} icon={Building2} value={company.nameAr as string} />
                    <Row label={t('company.nameEn')} value={<span className="num">{company.nameEn as string}</span>} />
                    <Row label={t('company.crNumber')} value={<span className="num">{(company.crNumber as string) || '—'}</span>} />
                    <Row label={t('company.vatNumber')} value={<span className="num">{(company.vatNumber as string) || '—'}</span>} />
                    <Row label={t('company.city')} icon={MapPin} value={`${company.city as string} — ${company.region as string}`} />
                    <Row label={t('company.email')} icon={Mail} value={<span className="num">{company.contactEmail as string}</span>} />
                    <Row label={t('company.phone')} icon={Phone} value={<span className="num" dir="ltr">{company.contactPhone as string}</span>} />
                    <Row label={t('company.joinDate')} value={formatDate((company.createdAt as string) ?? '', 'd MMMM yyyy')} />
                  </dl>
                )}
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={openEdit} disabled={!company}>{t('company.updateBtn')}</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('company.activitySummary')}</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y">
                  <Row label="رحلات منجزة" icon={Truck} value={
                    <span className="num font-medium">{(stats?.orders ?? 0).toLocaleString('en-US')}</span>
                  } />
                  <Row label="متوسط التقييم" icon={Star} value={
                    <span className="num font-medium">
                      {((company?.rating as number | undefined) ?? 0).toFixed(1)} / 5.0
                    </span>
                  } />
                  <Row label="وقت الاستجابة" value={
                    <span className="num font-medium">
                      {(company?.responseTimeMins as number | undefined) ?? '—'} دقيقة
                    </span>
                  } />
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Team ─── */}
        <TabsContent value="team">
          <TeamTab
            companyId={companyId ?? ''}
            companyKind="CARRIER"
            currentRole="OWNER"
          />
        </TabsContent>

        {/* ─── Preferences ─── */}
        <TabsContent value="settings">
        </TabsContent>

        {/* ─── KYC Documents ─── */}
        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle>{t('kyc.title')}</CardTitle>
                  <CardDescription className="mt-1">{t('kyc.subtitle')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={kycDocType} onValueChange={setKycDocType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KYC_TYPES.map((k) => (
                        <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleKycUpload(f); }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading || !companyId}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'جارٍ الرفع…' : t('kyc.uploadDoc')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!kycDocs ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-lg border bg-muted/40 animate-pulse" />
                  ))}
                </div>
              ) : kycDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">لا توجد وثائق مرفوعة بعد.</p>
              ) : (
                kycDocs.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-10 w-10 rounded-md bg-muted text-muted-foreground grid place-items-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {KYC_TYPES.find((k) => k.value === d.type)?.label ?? d.type}
                        </span>
                        <Badge variant={d.status === 'APPROVED' ? 'success' : d.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                          {d.status === 'APPROVED' ? t('kyc.approved')
                            : d.status === 'REJECTED' ? 'مرفوض'
                            : 'قيد المراجعة'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(d.createdAt, 'd MMM yyyy')}</p>
                      {d.notes && <p className="text-xs text-muted-foreground">{d.notes}</p>}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">{t('kyc.viewDoc')}</a>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Edit Company Dialog ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('company.updateBtn')}</DialogTitle>
            <DialogDescription>تعديل بيانات الشركة — لن تؤثر التغييرات على حالة التحقق المعتمدة.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>{t('company.nameAr')}</Label>
              <Input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('company.nameEn')}</Label>
              <Input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('company.crNumber')}</Label>
              <Input value={form.crNumber} onChange={(e) => setForm((f) => ({ ...f, crNumber: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('company.vatNumber')}</Label>
              <Input value={form.vatNumber} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('company.city')}</Label>
              <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>المنطقة</Label>
              <Input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('company.phone')}</Label>
              <Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('company.email')}</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} dir="ltr" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button>
            <Button onClick={saveCompany} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-sm font-medium text-end max-w-[60%] leading-relaxed">{value ?? '—'}</dd>
    </div>
  );
}
