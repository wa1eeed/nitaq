import * as React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '../utils/cn';

export interface MapPlaceholderProps {
  originCity: string;
  destinationCity: string;
  progress?: number;
  caption?: string;
  className?: string;
}

export function MapPlaceholder({
  originCity, destinationCity, progress = 0.5, caption, className,
}: MapPlaceholderProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={cn(
      'relative overflow-hidden rounded-lg border border-border',
      'bg-gradient-to-br from-primary-soft via-bg-page to-bg-subtle',
      'min-h-[280px] p-6',
      className,
    )}>
      <div aria-hidden className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
        backgroundSize: '20px 20px', color: '#0A3D3A',
      }} />

      <div className="relative h-full flex flex-col">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Navigation className="w-3.5 h-3.5" />
          تتبّع لحظي
        </div>

        <div className="flex-1 flex items-center justify-between gap-3 py-7">
          <Pin city={originCity} />
          <div className="flex-1 relative h-8 mx-2">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-[repeating-linear-gradient(to_left,hsl(var(--primary))_0_8px,transparent_8px_14px)] opacity-50" />
            <div className="absolute end-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary" style={{ width: `${pct}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 grid place-items-center w-7 h-7 rounded-full bg-card shadow-sm border border-primary text-primary"
              style={{ insetInlineEnd: `calc(${pct}% - 14px)` }}
            >
              <TruckIcon />
            </div>
          </div>
          <Pin city={destinationCity} />
        </div>

        {caption && (
          <div className="mt-2 text-center text-xs text-muted-foreground">{caption}</div>
        )}
      </div>
    </div>
  );
}

function Pin({ city }: { city: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className="w-10 h-10 rounded-full bg-card shadow-sm border border-border grid place-items-center text-primary">
        <MapPin className="w-4 h-4" />
      </div>
      <div className="text-sm font-semibold text-foreground truncate max-w-[120px]">{city}</div>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}
