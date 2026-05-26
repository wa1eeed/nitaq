import Link from 'next/link';
import { Award, Lightbulb, MapPin, Shield, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/page-shell';

export const metadata = {
  title: 'عن نِطاق — رؤيتنا ورسالتنا',
  description: 'تعرّف على رؤية ورسالة وقيم منصة نِطاق في رقمنة قطاع الخدمات السعودي',
};

const VALUES = [
  { icon: Shield,    title: 'الثقة',      desc: 'كل مزوّد معتمد، كل دفعة محمية، كل تعامل موثّق.' },
  { icon: Lightbulb, title: 'الابتكار',  desc: 'حلول تقنية ذكية تختصر الوقت والتكلفة.' },
  { icon: Users,     title: 'الشراكة',   desc: 'نمو مشترك مع مقدّمي الخدمة والعملاء.' },
  { icon: Award,     title: 'الجودة',     desc: 'معايير صارمة في الخدمة والتقنية.' },
];

const STATS = [
  { num: '500+',     label: 'مزوّد خدمة معتمد' },
  { num: '12,000+',  label: 'طلب خدمة منجز' },
  { num: '15',       label: 'مدينة سعودية' },
  { num: '98.4%',    label: 'معدّل رضا العملاء' },
];

export default function AboutPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="bg-primary/[0.03] border-b">
        <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">عن نِطاق</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            نِطاق سوق B2B متخصص يربط الشركات السعودية بمئات مزوّدي الخدمات الموثّقين — مستشارين، مهندسين، مصممين، فنيين، ومطورين — بعروض شفافة ودفع آمن بنظام Escrow.
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
            <h2 className="text-3xl font-bold mb-4">بناء سوق خدمات B2B موثوق في المملكة</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              نهدف إلى توحيد سوق خدمات الأعمال في منصة واحدة شفافة، حيث تجد الشركات أفضل مزوّدي الخدمات المعتمدين في دقائق — استشارات، تطوير تقني، صيانة، تصميم، وأكثر.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              نُسهم بذلك في تحقيق أهداف رؤية المملكة 2030 لرقمنة الاقتصاد وتطوير قطاع الخدمات، وتمكين رواد الأعمال ومقدّمي الخدمات من التوسع والنمو.
            </p>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-3">
              <Lightbulb className="h-5 w-5" />
              رؤيتنا
            </div>
            <h2 className="text-3xl font-bold mb-4">المنصة الأولى لخدمات الأعمال B2B</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              أن نكون المرجع الأول لخدمات الأعمال في السعودية والشرق الأوسط — نخدم آلاف الشركات يومياً عبر شبكة من مزوّدي الخدمات الموثّقين بالسجل التجاري والشهادات المهنية.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              نسعى لتقديم تجربة مبسّطة وآمنة: مزاد شفاف، Escrow مضمون، مطابقة ذكية بالذكاء الاصطناعي، ودعم متخصص على مدار الساعة.
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
          <h2 className="text-3xl font-bold mb-3">ابدأ مجاناً اليوم</h2>
          <p className="opacity-90 mb-6">انضم لآلاف الشركات السعودية التي تستخدم نِطاق لإدارة خدماتها</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button asChild variant="secondary" size="lg">
              <a href={`${process.env.NEXT_PUBLIC_CLIENT_URL ?? 'http://localhost:3002'}/register`}>سجّل شركتك مجاناً</a>
            </Button>
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <a href={`${process.env.NEXT_PUBLIC_CARRIER_URL ?? 'http://localhost:3003'}/register`}>انضم كمزوّد خدمة</a>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
