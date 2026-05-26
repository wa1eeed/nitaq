'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Clock, HelpCircle, LifeBuoy, Loader2, Mail, MessageSquare, Phone, Plus,
} from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { notify } from '@/lib/notify';
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import {
  CURRENT_CARRIER_ID, formatRelative, ticketsFor,
  type TicketStatus, type TicketPriority, type TicketCategory,
} from '@naqla/shared-utils';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوحة', IN_PROGRESS: 'قيد المعالجة', WAITING_USER: 'بانتظار ردك',
  RESOLVED: 'محلولة', CLOSED: 'مغلقة',
};
const STATUS_BADGE: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  OPEN: 'warning', IN_PROGRESS: 'default', WAITING_USER: 'destructive',
  RESOLVED: 'success', CLOSED: 'outline',
};
const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'منخفضة', MEDIUM: 'متوسطة', HIGH: 'عالية', URGENT: 'عاجلة',
};
const PRIORITY_BADGE: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  LOW: 'outline', MEDIUM: 'default', HIGH: 'warning', URGENT: 'destructive',
};
const CATEGORY_LABELS: Record<string, string> = {
  ACCOUNT: 'حساب', BILLING: 'فواتير ومدفوعات', ORDER: 'طلب',
  TECHNICAL: 'مشكلة تقنية', KYC: 'اعتماد KYC', DRIVER: 'سائق', OTHER: 'أخرى',
  GENERAL: 'استفسار عام',
};
const API_CATEGORIES: { value: string; label: string }[] = [
  { value: 'TECHNICAL', label: 'مشكلة تقنية' },
  { value: 'BILLING',   label: 'فواتير ومدفوعات' },
  { value: 'ACCOUNT',   label: 'حساب' },
  { value: 'ORDER',     label: 'طلب' },
  { value: 'GENERAL',   label: 'استفسار عام' },
];
type ApiTicket = { id: string; subject: string; category: string; status: string; createdAt: string; updatedAt: string };

const FAQ = [
  { q: 'متى يُفرَج عن المبلغ بعد التسليم؟',  a: 'يُفرَج عن المبلغ من Escrow خلال 3 أيام عمل من تأكيد التسليم وعدم وجود نزاع.' },
  { q: 'كيف أرفع وثائق شركتي؟',             a: 'من صفحة "الوثائق" يمكنك رفع السجل التجاري، التأمين، رخصة النقل، وغيرها — ومتابعة صلاحيتها.' },
  { q: 'ما نسبة العمولة على كل رحلة؟',       a: 'نسبة العمولة الافتراضية 8% من قيمة الطلب، وتظهر بشفافية في تفاصيل كل عملية.' },
  { q: 'كيف أضيف سائق أو شاحنة جديدة؟',    a: 'من قسم "الأسطول": شاحنات أو سائقون، ثم زر "إضافة". تظهر الشاحنة فوراً في الأسطول وقابلة لقبول الطلبات.' },
  { q: 'هل يمكنني سحب عرض بعد تقديمه؟',    a: 'نعم، طالما لم يُقبل بعد. من سجل العروض اختر العرض ثم "سحب".' },
];

export default function CarrierSupportPage() {
  const { data: ticketsData, mutate: mutateTickets } = useSWR<ApiTicket[]>('/support/tickets', fetcher);
  const myTickets = useMemo<(ApiTicket | ReturnType<typeof ticketsFor>[number])[]>(() => {
    if (Array.isArray(ticketsData) && ticketsData.length > 0) return ticketsData;
    return ticketsFor('CARRIER', CURRENT_CARRIER_ID);
  }, [ticketsData]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', category: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.subject || !form.category || !form.description.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/support/tickets', {
        subject: form.subject,
        category: form.category,
        description: form.description.trim(),
      });
      await mutateTickets();
      notify.success('تم إنشاء التذكرة', 'سيردّ عليك فريق الدعم قريباً');
      setCreateOpen(false);
      setForm({ subject: '', category: '', description: '' });
    } catch (err) {
      notify.error(err, 'فشل إنشاء التذكرة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="مركز الدعم"
        subtitle="استفسارات، شكاوى، ومساعدة فنية"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> تذكرة جديدة
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ChannelCard
          icon={MessageSquare}
          title="محادثة فورية"
          subtitle="رد فوري خلال دقائق · 24/7"
          cta="بدء محادثة"
          tone="bg-primary/10 text-primary"
        />
        <ChannelCard
          icon={Phone}
          title="اتصال هاتفي"
          subtitle="السبت – الخميس، 8 ص – 8 م"
          cta="+966 920 000 000"
          tone="bg-info/15 text-info"
        />
        <ChannelCard
          icon={Mail}
          title="بريد إلكتروني"
          subtitle="رد خلال 12 ساعة عمل"
          cta="support@nitaq.sa"
          tone="bg-success/15 text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تذاكري</CardTitle>
            <CardDescription>{myTickets.length} تذكرة · سجل كامل</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {myTickets.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <LifeBuoy className="h-10 w-10 mx-auto mb-3 opacity-40" />
                لا توجد تذاكر — ابدأ بإنشاء واحدة عند الحاجة
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموضوع</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTickets.map((t) => {
                    const tk = t as Partial<ReturnType<typeof ticketsFor>[number]> & ApiTicket;
                    const priority = tk.priority ?? 'MEDIUM';
                    return (
                      <TableRow key={tk.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{tk.subject}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {tk.id}
                            {tk.messageCount != null && <> · {tk.messageCount} رسالة</>}
                            {tk.orderId && <> · <Link href={`/orders/${tk.orderId}`} className="text-primary">{tk.orderId}</Link></>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{CATEGORY_LABELS[tk.category] ?? tk.category}</Badge>
                        </TableCell>
                        <TableCell><Badge variant={PRIORITY_BADGE[priority]}>{PRIORITY_LABELS[priority]}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground"><Clock className="h-3 w-3 inline me-1" />{formatRelative(tk.updatedAt)}</TableCell>
                        <TableCell><Badge variant={STATUS_BADGE[tk.status] ?? 'default'}>{STATUS_LABELS[tk.status] ?? tk.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* FAQ sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                أسئلة شائعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {FAQ.map((item, i) => (
                <details key={i} className="text-sm">
                  <summary className="font-medium cursor-pointer hover:text-primary py-1">{item.q}</summary>
                  <p className="text-muted-foreground text-xs mt-1 ps-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تذكرة دعم جديدة</DialogTitle>
            <DialogDescription>صف المشكلة بوضوح ليتمكّن الفريق من المساعدة بسرعة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>موضوع التذكرة</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="ملخص قصير..." />
            </div>
            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                <SelectContent>
                  {API_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التفاصيل</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="اشرح المشكلة بتفصيل واضح..."
                className="w-full min-h-[120px] p-3 rounded-md border bg-background text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>إلغاء</Button>
            <Button
              onClick={submit}
              disabled={!form.subject || !form.category || !form.description.trim() || submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChannelCard({ icon: Icon, title, subtitle, cta, tone }: { icon: any; title: string; subtitle: string; cta: string; tone: string }) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-start gap-3">
        <div className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          <div className="mt-2 text-sm font-medium text-primary truncate">{cta}</div>
        </div>
      </CardContent>
    </Card>
  );
}
