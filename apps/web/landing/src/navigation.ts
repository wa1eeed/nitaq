import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export const DEFAULT_LOCALE = 'en';
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nav: any = createSharedPathnamesNavigation({
  locales: SUPPORTED_LOCALES,
  localePrefix: 'always',
});

export const Link = nav.Link;
export const redirect = nav.redirect;
export const usePathname = nav.usePathname;
export const useRouter = nav.useRouter;
