'use client';
import { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/page-shell';

const CHANNELS = [
  { icon: Phone,         title: 'اتصال هاتفي',     value: '+966 920 000 000',  desc: 'السبت – الخميس، 8 ص – 8 م',  tone: 'bg-primary/10 text-primary' },
  { icon: Mail,          title: 'بريد إلكتروني',    value: 'support@nitaq.sa',  desc: 'رد خلال 12 ساعة عمل',          tone: 'bg-info/15 text-info' },
  { icon: MessageSquare, title: 'محادثة فورية',     value: 'متاحة 24/7',         desc: 'رد فوري خلال دقائق',           tone: 'bg-success/15 text-success' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', topic: 'general' });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: '', email: '', subject: '', message: '', topic: 'general' });
    }, 3000);
  };

  return (
    <PageShell>
      <section className="bg-primary/[0.03] border-b">
        <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">تواصل معنا</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            فريقنا جاهز للإجابة على استفساراتك ومساعدتك في كل ما يخص المنصة
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title}>
                <CardContent className="pt-6 flex items-start gap-3">
                  <div className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${c.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{c.title}</h3>
                    <div className="mt-0.5 text-sm font-medium text-primary truncate" dir="ltr">{c.value}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto px-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-1">أرسل لنا رسالة</h2>
              <p className="text-sm text-muted-foreground mb-6">سنرد عليك خلال 12 ساعة عمل</p>

              {sent ? (
                <div className="rounded-lg bg-success/10 border border-success/30 p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                  <h3 className="font-semibold text-success">تم استلام رسالتك ✓</h3>
                  <p className="mt-1 text-sm text-muted-foreground">سنتواصل معك قريباً على بريدك المسجّل.</p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="الاسم الكامل" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="مثال: محمد العتيبي" required />
                    <Field label="البريد الإلكتروني" type="email" dir="ltr" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="email@company.sa" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">الموضوع</label>
                    <select
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                    >
                      <option value="general">استفسار عام</option>
                      <option value="sales">مبيعات / شراكات</option>
                      <option value="support">دعم تقني</option>
                      <option value="legal">قانوني</option>
                      <option value="media">إعلام</option>
                    </select>
                  </div>

                  <Field label="عنوان الرسالة (اختياري)" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} placeholder="ملخص قصير..." />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">الرسالة</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={6}
                      placeholder="اشرح استفسارك بتفصيل..."
                      className="w-full p-3 rounded-md border bg-background text-sm leading-relaxed"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    <Send className="h-4 w-4" /> إرسال الرسالة
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <div className="mt-8 rounded-lg border bg-card p-6 flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">مقرّنا الرئيسي</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">الرياض، طريق الملك فهد، واحة الأعمال، الدور 12</p>
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> ساعات العمل: السبت – الخميس، 8 صباحاً – 8 مساءً
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', dir, required,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; dir?: 'rtl' | 'ltr'; required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        dir={dir}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-md border bg-background text-sm"
      />
    </div>
  );
}
