import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const SUPPORTED_LOCALES = ['ar'] as const;
export const DEFAULT_LOCALE = 'ar';
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_COOKIE = 'nitaq-locale-admin';

export function readLocaleFromHeaders(): Locale {
  return 'ar';
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
