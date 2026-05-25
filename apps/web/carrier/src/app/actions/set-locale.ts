'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from '@/i18n';

/**
 * Server action to persist the user's preferred locale.
 * Writes a cookie (used for SSR on the next request) and revalidates the
 * current page so the new translations render immediately.
 *
 * In production, this would also call the API to persist
 * `User.preferredLanguage` in the database so the choice applies across
 * sessions and devices.
 */
export async function setLocaleAction(locale: Locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return { ok: false };

  cookies().set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,    // 1 year
    httpOnly: false,                // readable by client JS (for instant updates)
    sameSite: 'lax',
    path: '/',
  });

  // TODO: in production, also call:
  // await api.patch('/api/users/me', { preferredLanguage: locale });

  revalidatePath('/', 'layout');
  return { ok: true };
}
