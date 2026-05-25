'use client';
import { useMemo, useState } from 'react';
import {
  AlertCircle, Bell, Building2, CheckCircle2, Eye, EyeOff, FileText, Filter,
  Key, Mail, MessageSquare, RotateCcw, Save, Search, Send, Settings,
  ShieldCheck, Smartphone, TestTube2, User, Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SMS_PROVIDERS,
  type NotificationCategory, type NotificationAudience, type NotificationTemplate,
} from '@naqla/shared-utils';
import { useNotificationsStore } from '@/stores/notifications-store';
import { cn } from '@/lib/utils';

const CATEGORY_META: Record<NotificationCategory, { label: string; tone: 'default' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  OTP:           { label: 'تحقّق OTP',      tone: 'warning' },
  TRANSACTIONAL: { label: 'معاملات',         tone: 'success' },
  NOTIFICATION:  { label: 'إشعار',            tone: 'default' },
  ALERT:         { label: 'تنبيه',            tone: 'destructive' },
};

const AUDIENCE_META: Record<NotificationAudience, { label: string; icon: any }> = {
  CLIENT:  { label: 'العميل',   icon: User },
  CARRIER: { label: 'الناقل',    icon: Building2 },
  ADMIN:   { label: 'الأدمن',    icon: ShieldCheck },
  DRIVER:  { label: 'السائق',    icon: Users },
};

export function NotificationsPanel() {
  return (
    <Tabs defaultValue="providers" className="space-y-6">
      <TabsList>
        <TabsTrigger value="providers">
          <Key className="h-4 w-4 me-1.5" /> مزوّدو الخدمة
        </TabsTrigger>
        <TabsTrigger value="templates">
          <FileText className="h-4 w-4 me-1.5" /> قوالب الإشعارات
        </TabsTrigger>
        <TabsTrigger value="general">
          <Settings className="h-4 w-4 me-1.5" /> إعدادات عامة
        </TabsTrigger>
      </TabsList>

      <TabsContent value="providers"><ProvidersTab /></TabsContent>
      <TabsContent value="templates"><TemplatesTab /></TabsContent>
      <TabsContent value="general"><GeneralTab /></TabsContent>
    </Tabs>
  );
}

// ─── Providers tab ────────────────────────────────────────────────────

function ProvidersTab() {
  const providers = useNotificationsStore((s) => s.providers);
  const updateEmail = useNotificationsStore((s) => s.updateEmailProvider);
  const updateSms = useNotificationsStore((s) => s.updateSmsProvider);
  const [showEmailKey, setShowEmailKey] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [testing, setTesting] = useState<'email' | 'sms' | null>(null);

  const testProvider = async (kind: 'email' | 'sms') => {
    setTesting(kind);
    await new Promise((r) => setTimeout(r, 800));
    setTesting(null);
    alert(kind === 'email' ? '✓ تم إرسال بريد اختبار (تجريبي)' : '✓ تم إرسال SMS اختبار (تجريبي)');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Resend (Email) */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-info/15 text-info grid place-items-center shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>البريد الإلكتروني — Resend.com</CardTitle>
                <CardDescription className="mt-1">قنوات البريد العابر (OTP، فواتير، تأكيدات)</CardDescription>
              </div>
            </div>
            <Switch checked={providers.email.enabled} onCheckedChange={(v) => updateEmail({ enabled: v })} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Key className="h-3.5 w-3.5" />
              API Key
            </Label>
            <div className="relative">
              <Input
                type={showEmailKey ? 'text' : 'password'}
                value={providers.email.apiKey}
                onChange={(e) => updateEmail({ apiKey: e.target.value })}
                placeholder="re_..."
                className="pe-10 font-mono text-sm"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowEmailKey(!showEmailKey)}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
              >
                {showEmailKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              احصل على المفتاح من resend.com/api-keys ←
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                dir="ltr"
                value={providers.email.fromEmail}
                onChange={(e) => updateEmail({ fromEmail: e.target.value })}
                placeholder="noreply@naqla.sa"
              />
            </div>
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={providers.email.fromName}
                onChange={(e) => updateEmail({ fromName: e.target.value })}
                placeholder="نقلة لوجيستك"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reply-To</Label>
            <Input
              dir="ltr"
              value={providers.email.replyTo}
              onChange={(e) => updateEmail({ replyTo: e.target.value })}
              placeholder="support@naqla.sa"
            />
          </div>

          <div className="pt-3 border-t flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!providers.email.apiKey || !providers.email.enabled || testing === 'email'}
              onClick={() => testProvider('email')}
            >
              <TestTube2 className="h-4 w-4" />
              {testing === 'email' ? 'جارٍ الاختبار...' : 'إرسال اختبار'}
            </Button>
            {providers.email.apiKey && providers.email.enabled && (
              <Badge variant="success" className="ms-auto">
                <CheckCircle2 className="h-3 w-3 me-1" />
                مفعّل
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SMS Provider */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/15 text-success grid place-items-center shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>الرسائل النصية — SMS</CardTitle>
                <CardDescription className="mt-1">قنوات الرسائل (OTP، تنبيهات، تذكير)</CardDescription>
              </div>
            </div>
            <Switch checked={providers.sms.enabled} onCheckedChange={(v) => updateSms({ enabled: v })} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>المزوّد</Label>
            <Select
              value={providers.sms.provider}
              onValueChange={(v) => updateSms({ provider: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SMS_PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground ms-2">({p.region})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Key className="h-3.5 w-3.5" />
              API Key
            </Label>
            <div className="relative">
              <Input
                type={showSmsKey ? 'text' : 'password'}
                value={providers.sms.apiKey}
                onChange={(e) => updateSms({ apiKey: e.target.value })}
                placeholder="أدخل مفتاح API"
                className="pe-10 font-mono text-sm"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowSmsKey(!showSmsKey)}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
              >
                {showSmsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sender ID</Label>
            <Input
              dir="ltr"
              value={providers.sms.senderId}
              onChange={(e) => updateSms({ senderId: e.target.value })}
              placeholder="NAQLA"
              maxLength={11}
            />
            <p className="text-xs text-muted-foreground">حروف إنجليزية فقط، حد أقصى 11 حرفاً</p>
          </div>

          <div className="pt-3 border-t flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!providers.sms.apiKey || !providers.sms.enabled || testing === 'sms'}
              onClick={() => testProvider('sms')}
            >
              <TestTube2 className="h-4 w-4" />
              {testing === 'sms' ? 'جارٍ الاختبار...' : 'إرسال اختبار'}
            </Button>
            {providers.sms.apiKey && providers.sms.enabled && (
              <Badge variant="success" className="ms-auto">
                <CheckCircle2 className="h-3 w-3 me-1" />
                مفعّل
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security notice */}
      <div className="lg:col-span-2">
        <Card className="border-warning/30 bg-warning/[0.04]">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">حماية المفاتيح</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                المفاتيح مخزّنة محلياً في هذا العرض التجريبي. في الإنتاج، احفظها كأسرار في خدمة الـ Secrets الخاصة بالبيئة (AWS Secrets Manager / Doppler / Vault) ولا تعرضها في الواجهة. هذه الواجهة تكون آمنة فقط إذا كانت مرئية للأدمن المعتمد عبر RBAC.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Templates tab ────────────────────────────────────────────────────

function TemplatesTab() {
  const templates = useNotificationsStore((s) => s.templates);
  const resetAll = useNotificationsStore((s) => s.resetAllTemplates);
  const [q, setQ] = useState('');
  const [audience, setAudience] = useState<string>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? '');

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (audience !== 'ALL' && t.audience !== audience) return false;
      if (category !== 'ALL' && t.category !== category) return false;
      if (q && !`${t.name} ${t.description} ${t.id}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [templates, q, audience, category]);

  const selected = templates.find((t) => t.id === selectedId) ?? filtered[0];

  const enabledCount = templates.filter((t) => t.enabled).length;

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="إجمالي القوالب" value={templates.length} />
        <StatTile label="مفعّلة" value={enabledCount} tone="success" />
        <StatTile label="OTP" value={templates.filter((t) => t.category === 'OTP').length} />
        <StatTile label="معاملات" value={templates.filter((t) => t.category === 'TRANSACTIONAL').length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* Left list */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في القوالب..." className="pe-10" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue placeholder="الجمهور" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">كل الجمهور</SelectItem>
                    {Object.entries(AUDIENCE_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="الفئة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">كل الفئات</SelectItem>
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-1 pe-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  لا توجد قوالب مطابقة
                </div>
              ) : (
                filtered.map((t) => (
                  <TemplateListItem
                    key={t.id}
                    template={t}
                    selected={selected?.id === t.id}
                    onSelect={() => setSelectedId(t.id)}
                  />
                ))
              )}
            </div>

            <Button variant="ghost" size="sm" className="w-full" onClick={() => {
              if (confirm('استرجاع كل القوالب للنسخة الافتراضية؟ ستُفقد التعديلات.')) resetAll();
            }}>
              <RotateCcw className="h-3.5 w-3.5" />
              استرجاع كل القوالب
            </Button>
          </CardContent>
        </Card>

        {/* Right editor */}
        {selected ? <TemplateEditor template={selected} /> : (
          <Card>
            <CardContent className="py-20 text-center text-sm text-muted-foreground">
              اختر قالباً من القائمة لتعديله
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('mt-0.5 text-2xl font-bold num', tone === 'success' && 'text-success')}>
        {value.toLocaleString('en-US')}
      </div>
    </div>
  );
}

function TemplateListItem({
  template, selected, onSelect,
}: { template: NotificationTemplate; selected: boolean; onSelect: () => void }) {
  const toggleTemplate = useNotificationsStore((s) => s.toggleTemplate);
  const audMeta = AUDIENCE_META[template.audience];
  const catMeta = CATEGORY_META[template.category];
  const AudIcon = audMeta.icon;
  const activeChannels = (['email', 'sms', 'inApp'] as const).filter((c) => template.channels[c].enabled);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-start rounded-lg border p-3 transition-colors',
        selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
        !template.enabled && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <AudIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm truncate">{template.name}</span>
        </div>
        <Switch
          checked={template.enabled}
          onCheckedChange={(v) => toggleTemplate(template.id, v)}
        />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <Badge variant={catMeta.tone} className="text-[10px]">{catMeta.label}</Badge>
        {activeChannels.map((c) => (
          <span key={c} className="text-[10px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {c === 'email' && <Mail className="h-2.5 w-2.5" />}
            {c === 'sms' && <Smartphone className="h-2.5 w-2.5" />}
            {c === 'inApp' && <Bell className="h-2.5 w-2.5" />}
            {c === 'email' ? 'بريد' : c === 'sms' ? 'SMS' : 'تطبيق'}
          </span>
        ))}
      </div>
    </button>
  );
}

function TemplateEditor({ template }: { template: NotificationTemplate }) {
  const toggleChannel = useNotificationsStore((s) => s.toggleChannel);
  const updateContent = useNotificationsStore((s) => s.updateChannelContent);
  const resetTemplate = useNotificationsStore((s) => s.resetTemplate);
  const [preview, setPreview] = useState<'email' | 'sms' | 'inApp'>('email');
  const [saved, setSaved] = useState(false);

  const audMeta = AUDIENCE_META[template.audience];
  const catMeta = CATEGORY_META[template.category];
  const AudIcon = audMeta.icon;

  const triggerSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const insertVariable = (channel: 'email' | 'sms' | 'inApp', v: string, field: 'subject' | 'body' = 'body') => {
    const current = template.channels[channel];
    const cur = (field === 'subject' ? current.subject : current.body) ?? '';
    updateContent(template.id, channel, { [field]: cur + v } as any);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={catMeta.tone}>{catMeta.label}</Badge>
              <Badge variant="outline">
                <AudIcon className="h-3 w-3 me-1" /> {audMeta.label}
              </Badge>
              <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">{template.id}</code>
            </div>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription className="mt-1">{template.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('استرجاع هذا القالب للنسخة الافتراضية؟')) resetTemplate(template.id);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> استرجاع
            </Button>
            <Button size="sm" onClick={triggerSaved}>
              {saved ? <><CheckCircle2 className="h-3.5 w-3.5" /> محفوظ</> : <><Save className="h-3.5 w-3.5" /> حفظ</>}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Variables */}
        {template.variables.length > 0 && (
          <div className="rounded-md bg-muted/40 p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              المتغيّرات المتاحة (اضغط للإدراج)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {template.variables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(preview, v)}
                  className="px-2 py-0.5 rounded font-mono text-xs bg-card border hover:border-primary"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Channel tabs */}
        <Tabs value={preview} onValueChange={(v) => setPreview(v as any)}>
          <TabsList>
            <TabsTrigger value="email">
              <Mail className="h-3.5 w-3.5 me-1" /> بريد
              {!template.channels.email.enabled && <span className="ms-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
            </TabsTrigger>
            <TabsTrigger value="sms">
              <Smartphone className="h-3.5 w-3.5 me-1" /> SMS
              {!template.channels.sms.enabled && <span className="ms-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
            </TabsTrigger>
            <TabsTrigger value="inApp">
              <Bell className="h-3.5 w-3.5 me-1" /> داخل التطبيق
              {!template.channels.inApp.enabled && <span className="ms-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
            </TabsTrigger>
          </TabsList>

          {/* Email channel */}
          <TabsContent value="email" className="space-y-3 pt-2">
            <ChannelToggle
              label="إرسال هذا الإشعار عبر البريد الإلكتروني"
              checked={template.channels.email.enabled}
              onChange={(v) => toggleChannel(template.id, 'email', v)}
            />
            <div className="space-y-2">
              <Label>عنوان البريد (Subject)</Label>
              <Input
                value={template.channels.email.subject ?? ''}
                onChange={(e) => updateContent(template.id, 'email', { subject: e.target.value })}
                disabled={!template.channels.email.enabled}
                placeholder="مثال: تأكيد طلبك {{orderNumber}}"
              />
            </div>
            <div className="space-y-2">
              <Label>نص البريد</Label>
              <textarea
                value={template.channels.email.body}
                onChange={(e) => updateContent(template.id, 'email', { body: e.target.value })}
                disabled={!template.channels.email.enabled}
                rows={8}
                className="w-full p-3 rounded-md border bg-background text-sm font-mono leading-relaxed disabled:opacity-50"
                placeholder="نص الرسالة..."
              />
            </div>
            <Preview channel="email" content={template.channels.email} />
          </TabsContent>

          {/* SMS channel */}
          <TabsContent value="sms" className="space-y-3 pt-2">
            <ChannelToggle
              label="إرسال هذا الإشعار عبر SMS"
              checked={template.channels.sms.enabled}
              onChange={(v) => toggleChannel(template.id, 'sms', v)}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>نص الرسالة</Label>
                <span className="text-xs text-muted-foreground num">
                  {template.channels.sms.body.length} / 160
                </span>
              </div>
              <textarea
                value={template.channels.sms.body}
                onChange={(e) => updateContent(template.id, 'sms', { body: e.target.value })}
                disabled={!template.channels.sms.enabled}
                rows={4}
                maxLength={320}
                className="w-full p-3 rounded-md border bg-background text-sm font-mono leading-relaxed disabled:opacity-50"
                placeholder="نص قصير ودقيق..."
              />
              {template.channels.sms.body.length > 160 && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  سيُحتسب كرسالتين (تجاوز 160 حرفاً)
                </p>
              )}
            </div>
            <Preview channel="sms" content={template.channels.sms} />
          </TabsContent>

          {/* In-app channel */}
          <TabsContent value="inApp" className="space-y-3 pt-2">
            <ChannelToggle
              label="إظهار هذا الإشعار داخل المنصة"
              checked={template.channels.inApp.enabled}
              onChange={(v) => toggleChannel(template.id, 'inApp', v)}
            />
            <div className="space-y-2">
              <Label>نص الإشعار</Label>
              <textarea
                value={template.channels.inApp.body}
                onChange={(e) => updateContent(template.id, 'inApp', { body: e.target.value })}
                disabled={!template.channels.inApp.enabled}
                rows={3}
                className="w-full p-3 rounded-md border bg-background text-sm leading-relaxed disabled:opacity-50"
                placeholder="نص يظهر في جرس الإشعارات وصفحة /notifications"
              />
            </div>
            <Preview channel="inApp" content={template.channels.inApp} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ChannelToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Preview({ channel, content }: { channel: 'email' | 'sms' | 'inApp'; content: { subject?: string; body: string } }) {
  const render = (text: string) => text.replace(/{{(\w+)}}/g, (_, k) => `[${k}]`);
  if (!content.body.trim()) return null;

  if (channel === 'email') {
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b bg-muted/40 flex items-center gap-2 text-xs">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">معاينة:</span>
          <span className="font-semibold truncate">{render(content.subject ?? 'بدون عنوان')}</span>
        </div>
        <pre className="p-4 text-sm leading-relaxed whitespace-pre-wrap font-sans">{render(content.body)}</pre>
      </div>
    );
  }
  if (channel === 'sms') {
    return (
      <div className="max-w-sm mx-auto rounded-2xl bg-success/10 border border-success/30 p-3" dir="rtl">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <MessageSquare className="h-3 w-3" />
          <span>معاينة SMS</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{render(content.body)}</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border bg-card p-3 flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        <Bell className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground mb-1">معاينة الإشعار داخل المنصة</div>
        <p className="text-sm leading-relaxed">{render(content.body)}</p>
      </div>
    </div>
  );
}

// ─── General tab ──────────────────────────────────────────────────────

function GeneralTab() {
  const general = useNotificationsStore((s) => s.providers.general);
  const updateGeneral = useNotificationsStore((s) => s.updateGeneral);

  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات التسليم العامة</CardTitle>
        <CardDescription>تحكّم في معدلات الإرسال وسلوك المحاولات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-2xl">
        <div className="space-y-2">
          <Label>الحد الأقصى للإرسال في الساعة</Label>
          <Input
            type="number"
            value={general.rateLimitPerHour}
            onChange={(e) => updateGeneral({ rateLimitPerHour: Number(e.target.value) })}
            min={1}
          />
          <p className="text-xs text-muted-foreground">يحمي من تجاوز حدود مزوّد الخدمة</p>
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border">
          <div>
            <Label>إعادة المحاولة عند الفشل</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">3 محاولات على فترات متباعدة</p>
          </div>
          <Switch
            checked={general.retryOnFailure}
            onCheckedChange={(v) => updateGeneral({ retryOnFailure: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <div className="flex items-start gap-2">
            <TestTube2 className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <Label>وضع الاختبار (Sandbox)</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">لا تُرسل رسائل حقيقية — تُسجَّل فقط</p>
            </div>
          </div>
          <Switch
            checked={general.sandboxMode}
            onCheckedChange={(v) => updateGeneral({ sandboxMode: v })}
          />
        </div>

        <div className="pt-3 border-t flex items-center gap-2">
          <Button>
            <Save className="h-4 w-4" /> حفظ الإعدادات
          </Button>
          <Button variant="outline">
            <Send className="h-4 w-4" /> إرسال إشعار اختبار
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
