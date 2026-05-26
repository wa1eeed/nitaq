import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight">نِطاق</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/about" className="text-muted-foreground hover:text-foreground px-3 py-2">عن نِطاق</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground px-3 py-2">تواصل</Link>
<Link href="/" className="px-3 py-2 text-primary hover:underline">الرئيسية ←</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-card border-t">
        <div className="max-w-[1280px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-base font-bold">نِطاق</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              منصة الخدمات الذكية في المملكة — نربط الشركات والأفراد بأفضل مقدّمي الخدمات بشفافية كاملة.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">المنصة</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">الرئيسية</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground">عن نِطاق</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">تواصل معنا</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">قانوني</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">شروط الاستخدام</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">سياسة الخصوصية</Link></li>
              <li><Link href="/transport" className="text-muted-foreground hover:text-foreground">شروط الخدمة</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t">
          <div className="max-w-[1280px] mx-auto px-6 py-5 text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} نِطاق · جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}
