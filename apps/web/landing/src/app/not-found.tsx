import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

/**
 * Root-level 404 — covers URLs that don't match the [locale] prefix (e.g.,
 * `/foo` instead of `/ar/foo`). The locale-aware 404 lives in
 * `[locale]/not-found.tsx`.
 *
 * `dynamic = 'force-dynamic'` is required because the root layout calls
 * `getLocale()` (next-intl) which reads cookies via `headers()`. Static
 * pre-rendering therefore fails; forcing dynamic skips the prerender
 * attempt and renders on-demand.
 */
export const dynamic = 'force-dynamic';

export default function RootNotFound() {
  return (
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
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
