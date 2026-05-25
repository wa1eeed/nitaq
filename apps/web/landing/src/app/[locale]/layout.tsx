import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { SUPPORTED_LOCALES, type Locale } from '@/i18n';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);
  return <>{children}</>;
}
