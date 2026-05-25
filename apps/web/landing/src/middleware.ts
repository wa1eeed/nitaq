import createMiddleware from 'next-intl/middleware';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './navigation';

export default createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});

export const config = {
  // Match all routes except API, _next, static files, and known asset folders
  matcher: ['/((?!api|_next|_vercel|truck-types|.*\\..*).*)'],
};
