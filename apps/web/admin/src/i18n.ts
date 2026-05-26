import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export const DEFAULT_LOCALE = 'en';
export type Locale = (typeof SUPPORTED_LOCALES)[number];
// Cookies are scoped by hostname only, not port. On localhost all three
// portals would share `nitaq-locale` and flip each other's language. Use
// a portal-specific cookie name so each app keeps its own locale.
export const LOCALE_COOKIE = 'nitaq-locale-admin';

/**
 * Cookie-based locale resolution for the internal apps (admin/client/carrier).
 * The user can change the locale only from /settings → "تفضيلات العرض".
 * No URL prefix — language preference lives in a cookie + (in production) in
 * `User.preferredLanguage`.
 */
export function readLocaleFromHeaders(): Locale {
  // Cookie wins
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  if (cookieLocale === 'ar' || cookieLocale === 'en') return cookieLocale;

  // Fallback to Accept-Language
  const accept = headers().get('accept-language')?.toLowerCase() ?? '';
  if (accept.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

async function buildConfig() {
  const locale = readLocaleFromHeaders();
  const [common, auth, orders, fleet, payments, notifications, admin, settings, landing] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    import(`../messages/${locale}/auth.json`).then((m) => m.default),
    import(`../messages/${locale}/orders.json`).then((m) => m.default),
    import(`../messages/${locale}/fleet.json`).then((m) => m.default),
    import(`../messages/${locale}/payments.json`).then((m) => m.default),
    import(`../messages/${locale}/notifications.json`).then((m) => m.default),
    import(`../messages/${locale}/admin.json`).then((m) => m.default),
    import(`../messages/${locale}/settings.json`).then((m) => m.default),
    import(`../messages/${locale}/landing.json`).then((m) => m.default),
  ]);
  return {
    locale,
    messages: { common, auth, orders, fleet, payments, notifications, admin, settings, landing },
    timeZone: 'Asia/Riyadh',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = getRequestConfig(buildConfig);
export default config;
