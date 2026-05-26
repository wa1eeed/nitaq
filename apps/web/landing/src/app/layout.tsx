import type { Metadata } from 'next';
import { Tajawal, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { OnlineStatusBar } from '@/components/online-status-bar';
import './globals.css';

const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-tajawal' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'نِطاق — Nitaq',
  description: 'منصة النقل اللوجستي الذكي في المملكة',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${tajawal.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <OnlineStatusBar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
