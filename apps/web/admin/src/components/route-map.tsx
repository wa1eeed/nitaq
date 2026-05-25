'use client';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const RouteMapImpl = dynamic(() => import('./route-map-impl').then((m) => m.RouteMapImpl), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height: 300 }}>
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse me-2" />
      جارٍ تحميل الخريطة...
    </div>
  ),
});

export interface RoutePoint {
  lat: number;
  lng: number;
  label: string;
}

export interface RouteMapProps {
  origin: RoutePoint;
  destination: RoutePoint;
  progress?: number;
  height?: number;
  className?: string;
}

export function RouteMap({ origin, destination, progress, height = 300, className }: RouteMapProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card', className)}>
      <RouteMapImpl origin={origin} destination={destination} progress={progress} height={height} />
    </div>
  );
}
