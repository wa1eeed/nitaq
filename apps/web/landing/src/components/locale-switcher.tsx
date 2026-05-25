'use client';
import { useLocale } from 'next-intl';
import { useRouter as useNextRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { usePathname, useRouter } from '@/navigation';

/**
 * Landing locale switcher.
 *
 * Uses next-intl's locale-aware router to replace the URL with the alternate
 * locale (e.g. /ar/about → /en/about), then forces a refresh so the root
 * layout re-runs `getLocale()` and emits new `<html lang dir>` attributes.
 *
 * Without `router.refresh()`, the `<html>` element keeps its old `dir`
 * because Next.js doesn't re-render it on a client-side soft navigation.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = locale === 'ar' ? 'en' : 'ar';
  const label = locale === 'ar' ? 'English' : 'العربية';

  const onClick = () => {
    startTransition(() => {
      router.replace(pathname, { locale: switchTo });
      // Force a server re-render so html dir/lang + every server component
      // picks up the new locale immediately (no manual reload needed).
      nextRouter.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md hover:bg-muted transition-colors disabled:opacity-60"
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
      <span className={switchTo === 'ar' ? 'font-arabic' : ''}>{label}</span>
    </button>
  );
}
