'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { setLocaleAction } from '@/app/actions/set-locale';
import { cn } from '@/lib/utils';

/**
 * Compact language picker shown at the top of registration pages so users
 * can pick their preferred language BEFORE filling out the form. The choice
 * persists via cookie (and later via `User.preferredLanguage` in DB).
 */
export function OnboardingLanguagePicker() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onPick = (code: 'ar' | 'en') => {
    if (code === locale) return;
    startTransition(async () => {
      await setLocaleAction(code);
      router.refresh();   // force server re-render so html dir/lang updates
    });
  };

  return (
    <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
      <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
        <Languages className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {locale === 'ar' ? 'اختر لغتك / Choose your language' : 'Choose your language / اختر لغتك'}
        </div>
        <div className="text-xs text-muted-foreground">
          {locale === 'ar' ? 'يمكنك تغييرها لاحقاً من الإعدادات' : 'You can change this later in settings'}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {(['ar', 'en'] as const).map((code) => (
          <button
            key={code}
            type="button"
            disabled={pending}
            onClick={() => onPick(code)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors disabled:opacity-60',
              locale === code
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/40',
            )}
          >
            {code === 'ar' ? '🇸🇦 العربية' : '🇬🇧 English'}
          </button>
        ))}
      </div>
    </div>
  );
}
