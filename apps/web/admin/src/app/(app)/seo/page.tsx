'use client';
import { useState } from 'react';
import {
  CheckCircle2, Code2, Facebook, FileText, Globe, Image as ImageIcon,
  Save, Search, Tag, Twitter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { useLegalStore } from '@/stores/legal-store';

export default function AdminSeoPage() {
  const seo = useLegalStore((s) => s.seo);
  const update = useLegalStore((s) => s.updateSeo);
  const reset = useLegalStore((s) => s.resetSeo);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const handleSave = () => {
    setSavedAt(new Date());
    setTimeout(() => setSavedAt(null), 2000);
  };

  return (
    <>
      <PageHeader
        title="إعدادات SEO وميتا"
        subtitle="تحكم في كيفية ظهور الموقع في محركات البحث ووسائل التواصل"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => {
              if (confirm('استرجاع كل إعدادات SEO للقيم الافتراضية؟')) reset();
            }}>استرجاع الافتراضي</Button>
            <Button onClick={handleSave}>
              {savedAt ? <><CheckCircle2 className="h-4 w-4" /> حُفظ</> : <><Save className="h-4 w-4" /> حفظ</>}
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general"><Globe className="h-4 w-4 me-1.5" /> عام</TabsTrigger>
          <TabsTrigger value="social"><Twitter className="h-4 w-4 me-1.5" /> Open Graph + Twitter</TabsTrigger>
          <TabsTrigger value="structured"><Code2 className="h-4 w-4 me-1.5" /> Schema/Structured</TabsTrigger>
          <TabsTrigger value="verification"><CheckCircle2 className="h-4 w-4 me-1.5" /> التحقق والتحليلات</TabsTrigger>
          <TabsTrigger value="preview"><Search className="h-4 w-4 me-1.5" /> معاينة SERP</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات الأساسية</CardTitle>
              <CardDescription>تظهر في عنوان نتيجة البحث والمتصفح</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-3xl">
              <div className="space-y-2">
                <Label>اسم الموقع</Label>
                <Input value={seo.siteName} onChange={(e) => update({ siteName: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>العنوان الافتراضي</Label>
                <Input value={seo.defaultTitle} onChange={(e) => update({ defaultTitle: e.target.value })} />
                <p className="text-xs text-muted-foreground num">
                  الطول: {seo.defaultTitle.length} حرف
                  {seo.defaultTitle.length > 60 && <span className="text-warning ms-1">⚠ مفضّل تحت 60 حرفاً</span>}
                </p>
              </div>

              <div className="space-y-2">
                <Label>قالب العنوان (Template)</Label>
                <Input value={seo.titleTemplate} onChange={(e) => update({ titleTemplate: e.target.value })} placeholder="%s | نِطاق" />
                <p className="text-xs text-muted-foreground">استخدم %s لاسم الصفحة</p>
              </div>

              <div className="space-y-2">
                <Label>الوصف الافتراضي (Meta Description)</Label>
                <textarea
                  value={seo.defaultDescription}
                  onChange={(e) => update({ defaultDescription: e.target.value })}
                  rows={4}
                  className="w-full p-3 rounded-md border bg-background text-sm leading-relaxed"
                />
                <p className="text-xs text-muted-foreground num">
                  الطول: {seo.defaultDescription.length} حرف
                  {seo.defaultDescription.length > 160 && <span className="text-warning ms-1">⚠ مفضّل تحت 160 حرفاً</span>}
                </p>
              </div>

              <div className="space-y-2">
                <Label>الكلمات المفتاحية (مفصولة بفاصلة)</Label>
                <Input
                  value={seo.defaultKeywords.join(', ')}
                  onChange={(e) => update({ defaultKeywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                  placeholder="نقل بضائع, شحن, لوجستيات"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {seo.defaultKeywords.map((k) => <Badge key={k} variant="outline" className="text-xs">{k}</Badge>)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الرابط الكنسي (Canonical)</Label>
                  <Input dir="ltr" value={seo.canonicalUrl} onChange={(e) => update({ canonicalUrl: e.target.value })} placeholder="https://nitaq.sa" />
                </div>
                <div className="space-y-2">
                  <Label>اللغة والمنطقة (Locale)</Label>
                  <Input dir="ltr" value={seo.locale} onChange={(e) => update({ locale: e.target.value })} placeholder="ar_SA" />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <Label>تعليمات robots.txt</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ToggleRow label="السماح بالأرشفة (index)" desc="إذا أوقفته لن يظهر الموقع في محركات البحث" checked={seo.robotsIndex} onChange={(v) => update({ robotsIndex: v })} />
                  <ToggleRow label="السماح بتتبع الروابط (follow)" desc="السماح بزحف الروابط الداخلية والخارجية" checked={seo.robotsFollow} onChange={(v) => update({ robotsFollow: v })} />
                </div>
                <div className="rounded-md bg-muted/40 p-3 text-xs font-mono" dir="ltr">
                  &lt;meta name="robots" content="{seo.robotsIndex ? 'index' : 'noindex'}, {seo.robotsFollow ? 'follow' : 'nofollow'}" /&gt;
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Open Graph + Twitter Cards</CardTitle>
              <CardDescription>تتحكم في كيفية ظهور الموقع عند المشاركة على فيسبوك، تويتر، واتساب</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-3xl">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> صورة المشاركة (Open Graph Image)</Label>
                <Input dir="ltr" value={seo.ogImage} onChange={(e) => update({ ogImage: e.target.value })} placeholder="https://nitaq.sa/og-image.png" />
                <p className="text-xs text-muted-foreground">المقاس الموصى به: 1200×630 بكسل</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Twitter className="h-3.5 w-3.5" /> Twitter Handle</Label>
                <Input dir="ltr" value={seo.twitterHandle} onChange={(e) => update({ twitterHandle: e.target.value })} placeholder="@nitaq_sa" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Theme Color</Label>
                <div className="flex items-center gap-2">
                  <Input dir="ltr" value={seo.themeColor} onChange={(e) => update({ themeColor: e.target.value })} className="max-w-[200px]" />
                  <div className="h-9 w-9 rounded-md border shadow-sm" style={{ backgroundColor: seo.themeColor }} />
                </div>
              </div>

              {/* OG preview */}
              <div className="pt-3 border-t">
                <Label className="mb-2 block">معاينة بطاقة OG</Label>
                <div className="max-w-md rounded-lg border overflow-hidden bg-card">
                  <div className="aspect-[1200/630] bg-muted grid place-items-center text-muted-foreground text-xs">
                    {seo.ogImage ? (
                      <img src={seo.ogImage} alt="OG" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      'صورة OG غير محددة'
                    )}
                  </div>
                  <div className="p-3 text-xs space-y-1" dir="ltr">
                    <div className="text-muted-foreground uppercase">{new URL(seo.canonicalUrl || 'https://example.com').hostname}</div>
                    <div className="font-semibold line-clamp-2" dir="auto">{seo.defaultTitle}</div>
                    <div className="text-muted-foreground line-clamp-2" dir="auto">{seo.defaultDescription}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structured">
          <Card>
            <CardHeader>
              <CardTitle>JSON-LD / Structured Data</CardTitle>
              <CardDescription>بيانات الشركة المنظّمة لـ Google Knowledge Graph</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المنظمة</Label>
                  <Input value={seo.organizationName} onChange={(e) => update({ organizationName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>شعار المنظمة (URL)</Label>
                  <Input dir="ltr" value={seo.organizationLogo} onChange={(e) => update({ organizationLogo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الهاتف</Label>
                  <Input dir="ltr" value={seo.organizationPhone} onChange={(e) => update({ organizationPhone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>البريد</Label>
                  <Input dir="ltr" value={seo.organizationEmail} onChange={(e) => update({ organizationEmail: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>معاينة JSON-LD</Label>
                <pre className="rounded-md bg-muted/40 p-3 text-xs font-mono overflow-x-auto" dir="ltr">{JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  "name": seo.organizationName,
                  "logo": seo.organizationLogo,
                  "url": seo.canonicalUrl,
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": seo.organizationPhone,
                    "email": seo.organizationEmail,
                    "contactType": "customer service",
                    "availableLanguage": ["Arabic", "English"],
                  },
                }, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>التحقّق والتحليلات</CardTitle>
              <CardDescription>رموز التحقق من ملكية الموقع ومعرفات أدوات التحليل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-3xl">
              <div className="space-y-2">
                <Label>Google Search Console — رمز التحقق</Label>
                <Input dir="ltr" value={seo.googleSiteVerification} onChange={(e) => update({ googleSiteVerification: e.target.value })} placeholder="google-site-verification=..." />
              </div>
              <div className="space-y-2">
                <Label>Bing Webmaster — رمز التحقق</Label>
                <Input dir="ltr" value={seo.bingSiteVerification} onChange={(e) => update({ bingSiteVerification: e.target.value })} placeholder="msvalidate.01=..." />
              </div>

              <div className="pt-3 border-t space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Search className="h-3.5 w-3.5" /> Google Analytics (G-XXXX)</Label>
                  <Input dir="ltr" value={seo.googleAnalyticsId} onChange={(e) => update({ googleAnalyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Facebook className="h-3.5 w-3.5" /> Meta Pixel ID</Label>
                  <Input dir="ltr" value={seo.facebookPixelId} onChange={(e) => update({ facebookPixelId: e.target.value })} placeholder="1234567890" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>كيف يظهر الموقع في Google</CardTitle>
              <CardDescription>تقريبي — قد يختلف حسب جهاز البحث وكلمات البحث</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl rounded-lg border p-4 bg-card font-sans" dir="ltr">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{seo.canonicalUrl.replace(/https?:\/\//, '').replace(/\/$/, '')}</span>
                </div>
                <h3 className="text-xl text-blue-600 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1" dir="auto">
                  {seo.defaultTitle}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2" dir="auto">
                  {seo.defaultDescription}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <ScoreCard label="طول العنوان" value={seo.defaultTitle.length} max={60} />
                <ScoreCard label="طول الوصف" value={seo.defaultDescription.length} max={160} />
                <ScoreCard label="كلمات مفتاحية" value={seo.defaultKeywords.length} max={10} ideal={6} />
                <ScoreCard label="OG محدّد" value={seo.ogImage ? 1 : 0} max={1} ideal={1} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border">
      <div>
        <Label>{label}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ScoreCard({ label, value, max, ideal }: { label: string; value: number; max: number; ideal?: number }) {
  const target = ideal ?? max;
  const good = value > 0 && value <= max;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium">{label}</span>
        <span className={`num font-bold ${good ? 'text-success' : 'text-warning'}`}>
          {value} / {max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={good ? 'bg-success h-full' : 'bg-warning h-full'}
          style={{ width: `${Math.min(100, (value / target) * 100)}%` }}
        />
      </div>
    </div>
  );
}
