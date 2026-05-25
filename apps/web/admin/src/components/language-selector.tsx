'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Languages, Check } from 'lucide-react';
import { setLocaleAction } from '@/app/actions/set-locale';
import { cn } from '@/lib/utils';

const LANGS = [
  { code: 'ar', native: 'العربية', english: 'Arabic', dir: 'rtl' as const, flag: '🇸🇦' },
  { code: 'en', native: 'English', english: 'English', dir: 'ltr' as const, flag: '🇬🇧' },
];

/**
 * Language picker for admin/client/carrier settings pages.
 *   - server action writes the locale cookie
 *   - revalidatePath triggers a soft refresh with the new strings
 *   - kept simple: two large buttons, no dropdown, since switching is rare.
 */
export function LanguageSelector() {
  const t = useTranslations('common');
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSelect = (code: 'ar' | 'en') => {
    if (code === current) return;
    startTransition(async () => {
      await setLocaleAction(code);
      // The cookie is now updated server-side. `router.refresh()` forces a
      // server re-render so the root layout reads the new cookie and emits
      // <html lang="..." dir="..."> with the right values. Without this,
      // `dir` would stay stale until the next full page load.
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Languages className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t('language')}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {LANGS.map((lang) => {
          const isActive = current === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              disabled={pending}
              onClick={() => onSelect(lang.code as 'ar' | 'en')}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border-2 transition-colors disabled:opacity-60',
                isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>{lang.flag}</span>
                <div className="text-start">
                  <div className="font-semibold">{lang.native}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{lang.english}</div>
                </div>
              </div>
              {isActive && <Check className="h-5 w-5 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {current === 'ar'
          ? 'يُحفظ التفضيل تلقائياً ويُطبَّق على كل الجلسات.'
          : 'Your preference is saved automatically and applied across all sessions.'}
      </p>
    </div>
  );
}
