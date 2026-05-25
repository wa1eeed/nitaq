'use client';
import { Truck } from 'lucide-react';
import { usePlatformStore } from '@/stores/platform-store';
import { cn } from '@/lib/utils';

/**
 * Platform logo block. Renders the uploaded image when `platform_logo` is set,
 * otherwise falls back to the default Truck icon. Size variants match the
 * existing sidebar usage (compact = 36px square, default = 44px).
 *
 * Reads from `usePlatformStore` (localStorage-backed). Once the backend
 * Setting API is wired, swap to read from there.
 */
export function Logo({ size = 'compact', className }: { size?: 'compact' | 'lg'; className?: string }) {
  const logoUrl = usePlatformStore((s) => s.logoUrl);
  const nameAr = usePlatformStore((s) => s.nameAr);
  const dims = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const icon = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold overflow-hidden',
        dims,
        className,
      )}
      aria-label={nameAr}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={nameAr} className="h-full w-full object-contain p-1" />
      ) : (
        <Truck className={icon} />
      )}
    </div>
  );
}
