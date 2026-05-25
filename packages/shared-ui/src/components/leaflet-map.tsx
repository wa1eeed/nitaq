'use client';
import * as React from 'react';
import { cn } from '../utils/cn';

export interface RoutePoint {
  lat: number;
  lng: number;
  label: string;
}

export interface RouteMapProps {
  origin: RoutePoint;
  destination: RoutePoint;
  /** 0..1 — animates a truck marker along the route. */
  progress?: number;
  height?: number | string;
  className?: string;
}

const Skeleton = ({ height }: { height: number | string }) => (
  <div
    className="rounded-xl bg-muted/40 grid place-items-center"
    style={{ height: typeof height === 'number' ? `${height}px` : height }}
  >
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      جارٍ تحميل الخريطة...
    </div>
  </div>
);

/**
 * Client-only Leaflet map. We use `React.lazy` with a typeof-window guard
 * so the bundle never imports Leaflet during SSR (which would crash since
 * Leaflet touches `window` at module load time).
 */
const LazyLeafletMap = React.lazy(() =>
  import('./leaflet-map-impl').then((m) => ({ default: m.LeafletMap })),
);

export function RouteMap({ origin, destination, progress, height = 320, className }: RouteMapProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border', className)}>
      {mounted ? (
        <React.Suspense fallback={<Skeleton height={height} />}>
          <LazyLeafletMap origin={origin} destination={destination} progress={progress} height={height} />
        </React.Suspense>
      ) : (
        <Skeleton height={height} />
      )}
    </div>
  );
}

/* ─── Distance helpers ─────────────────────────────────────────── */

const EARTH_RADIUS_KM = 6371;

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)));
}

export function estimatedHours(km: number, avgSpeedKmh = 80): { hours: number; minutes: number } {
  const total = km / avgSpeedKmh;
  const hours = Math.floor(total);
  const minutes = Math.round((total - hours) * 60);
  return { hours, minutes };
}

export function formatDuration(km: number): string {
  const { hours, minutes } = estimatedHours(km);
  if (hours === 0) return `${minutes} د`;
  return `${hours} س و ${minutes} د`;
}
