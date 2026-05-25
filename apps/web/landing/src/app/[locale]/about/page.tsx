import Link from 'next/link';
import { Award, Lightbulb, MapPin, Shield, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/page-shell';

export const metadata = {
  title: 'عن نقلة لوجيستك — رؤيتنا ورسالتنا',
  description: 'تعرّف على رؤية ورسالة وقيم منصة نقلة لوجيستك في رقمنة قطاع النقل السعودي',
};

const VALUES = [
  { icon: Shield,    title: 'الثقة',      desc: 'كل ناقل معتمد، كل دفعة محمية، كل تعامل موثّق.' },
  { icon: Lightbulb, title: 'الابتكار',  desc: 'حلول تقنية ذكية تختصر الوقت والتكلفة.' },
  { icon: Users,     title: 'الشراكة',   desc: 'نمو مشترك مع شركاء النقل والعملاء.' },
  { icon: Award,     title: 'الجودة',     desc: 'معايير صارمة في الخدمة والتقنية.' },
];

const STATS = [
  { num: '500+',     label: 'شركة نقل معتمدة' },
  { num: '12,000+',  label: 'شحنة شهرياً' },
  { num: '15',       label: 'مدينة سعودية' },
  { num: '98.4%',    label: 'معدّل التسليم الناجح' },
];

export default function AboutPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="bg-primary/[0.03] border-b">
        <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">عن نقلة لوجيستك</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            نُعيد تعريف قطاع النقل اللوجستي في المملكة العربية السعودية عبر منصة تقنية متكاملة تربط الشركات بأفضل ناقلي البضائع المعتمدين، بشفافية كاملة وأمان مالي مضمون.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold text-primary num">{s.num}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-3">
              <Target className="h-5 w-5" />
              رسالتنا
            </div>
            <h2 className="text-3xl font-bold mb-4">رقمنة قطاع النقل في المملكة</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              نهدف إلى توحيد سوق النقل اللوجستي في منصة واحدة شفافة، حيث يجد العميل أفضل الأسعار والخدمات في دقائق، ويجد الناقل طلبات حقيقية ومستقرة لتوسيع أعماله.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              نُسهم بذلك في تحقيق أهداف رؤية المملكة 2030 لرقمنة القطاع اللوجستي، الذي يُعد من الركائز الأساسية للاقتصاد الوطني.
            </p>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-3">
              <Lightbulb className="h-5 w-5" />
              رؤيتنا
            </div>
            <h2 className="text-3xl font-bold mb-4">المنصة الأولى للوجستيات</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              أن نكون المنصة الأولى للنقل والشحن اللوجستي في الشرق الأوسط، نخدم آلاف الشركات يومياً عبر شبكة موسّعة من الناقلين المعتمدين.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              نسعى لتقديم تجربة مستخدم سلسة، تكنولوجيا متقدمة (تتبع لحظي، Escrow، AI matching)، ودعم على مدار الساعة.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">قيمنا</h2>
            <p className="text-muted-foreground">الأسس التي نبني عليها كل قرار في المنصة</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title}>
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center mx-auto mb-3">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-1">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">مقرّنا الرئيسي</h2>
          <p className="text-muted-foreground mb-2">المملكة العربية السعودية — الرياض</p>
          <p className="text-muted-foreground text-sm">طريق الملك فهد، واحة الأعمال، الدور 12</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">جاهز للبدء؟</h2>
          <p className="opacity-90 mb-6">انضم لآلاف الشركات التي تستخدم نقلة يومياً</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button asChild variant="secondary" size="lg">
              <a href={`${process.env.NEXT_PUBLIC_CLIENT_URL ?? 'http://localhost:3002'}/register`}>سجّل كعميل</a>
            </Button>
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <a href={`${process.env.NEXT_PUBLIC_CARRIER_URL ?? 'http://localhost:3003'}/register`}>سجّل كناقل</a>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
