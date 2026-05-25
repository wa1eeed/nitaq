import Link from 'next/link';
import { FileQuestion, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/page-shell';

export default function NotFound() {
  return (
    <PageShell>
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="h-24 w-24 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto mb-6">
            <FileQuestion className="h-12 w-12" />
          </div>
          <h1 className="text-6xl font-bold tracking-tight num mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-2">الصفحة غير موجودة</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            عذراً، الصفحة التي تبحث عنها غير متاحة أو تم نقلها لمكان آخر.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button asChild>
              <Link href="/"><Home className="h-4 w-4" /> الصفحة الرئيسية</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact"><Mail className="h-4 w-4" /> تواصل معنا</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
