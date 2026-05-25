import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export const DEFAULT_LOCALE = 'ar';
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * URL-based locale routing for the landing site.
 *   - `/`        → middleware redirects to `/ar` (Accept-Language aware)
 *   - `/ar/...`  → Arabic, RTL, Tajawal
 *   - `/en/...`  → English, LTR, Inter
 */
async function buildConfig({ locale }: { locale: string }) {
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();
  const [common, auth, orders, fleet, payments, notifications, settings, landing] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    import(`../messages/${locale}/auth.json`).then((m) => m.default),
    import(`../messages/${locale}/orders.json`).then((m) => m.default),
    import(`../messages/${locale}/fleet.json`).then((m) => m.default),
    import(`../messages/${locale}/payments.json`).then((m) => m.default),
    import(`../messages/${locale}/notifications.json`).then((m) => m.default),
    import(`../messages/${locale}/settings.json`).then((m) => m.default),
    import(`../messages/${locale}/landing.json`).then((m) => m.default),
  ]);
  return {
    messages: { common, auth, orders, fleet, payments, notifications, settings, landing },
    timeZone: 'Asia/Riyadh',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = getRequestConfig(buildConfig);
export default config;
