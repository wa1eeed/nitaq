'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Platform-level branding settings. Mirrors the white-label keys seeded in
 * `apps/api/prisma/seed.ts` (`platform_logo`, `platform_name_ar`,
 * `platform_name_en`). For now the source of truth is localStorage in the
 * admin app; production will read these from the `Setting` table via API.
 *
 * Other apps (client/carrier/landing) will eventually fetch the same values
 * server-side and pass them down; that wire-up is tracked in CHANGELOG.
 */
export interface PlatformBranding {
  /** URL to the platform logo (PNG/SVG). Empty string ⇒ use default Truck icon. */
  logoUrl: string;
  /** Display name in Arabic. */
  nameAr: string;
  /** Display name in English. */
  nameEn: string;
}

interface PlatformState extends PlatformBranding {
  setLogoUrl: (url: string) => void;
  setName: (patch: Partial<Pick<PlatformBranding, 'nameAr' | 'nameEn'>>) => void;
  reset: () => void;
}

const DEFAULTS: PlatformBranding = {
  logoUrl: '',
  nameAr: 'نِطاق',
  nameEn: 'Nitaq',
};

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setLogoUrl: (url) => set({ logoUrl: url }),
      setName: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: 'nitaq-platform-branding' },
  ),
);
