'use client';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Impl = dynamic(() => import('./map-address-picker-impl').then((m) => m.MapAddressPickerImpl), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm border rounded-lg" style={{ height: 280 }}>
      <Loader2 className="h-4 w-4 animate-spin" />
      جارٍ تحميل الخريطة...
    </div>
  ),
});

export interface MapPoint {
  lat: number;
  lng: number;
  address: string;
}

interface MapAddressPickerProps {
  center: { lat: number; lng: number };
  value?: MapPoint;
  onChange: (point: MapPoint) => void;
  height?: number;
  label: string;
  /** Constrains address search to ~50km around the city center. */
  cityName?: string;
  className?: string;
}

/**
 * Wrapper that defers Leaflet to the client to avoid `window is not defined`
 * during SSR. All real logic lives in `map-address-picker-impl.tsx`.
 */
export function MapAddressPicker({ className, ...rest }: MapAddressPickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Impl {...rest} />
    </div>
  );
}
