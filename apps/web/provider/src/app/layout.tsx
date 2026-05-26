import type { Metadata } from 'next';
import { Tajawal, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';
import { OnlineStatusBar } from '@/components/online-status-bar';
import './globals.css';

const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-tajawal' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'نِطاق — منصة الناقل',
  description: 'فرص نقل، إدارة أسطول، أرباح',
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nitaq-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <OnlineStatusBar />
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            dir={isRtl ? 'rtl' : 'ltr'}
            toastOptions={{ duration: 4000 }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
