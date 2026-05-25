import * as React from 'react';
import { Check, Truck, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '../utils/cn';
import { Avatar } from './avatar';
import { RatingStars } from './rating-stars';

export interface CarrierCardProps {
  id: string;
  nameAr: string;
  city: string;
  rating: number;
  completedTrips: number;
  responseTimeMins: number;
  fleetSize: number;
  insurance?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

export function CarrierCard({
  id, nameAr, city, rating, completedTrips, responseTimeMins, fleetSize, insurance,
  selected, onSelect, className,
}: CarrierCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(id)}
      className={cn(
        'w-full text-start p-4 rounded-lg border-2 transition-all focus-ring',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-card hover:border-primary/40 hover:shadow',
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <Avatar name={nameAr} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-foreground truncate">{nameAr}</h4>
              <div className="mt-0.5 text-xs text-muted-foreground">{city}</div>
            </div>
            <RatingStars value={rating} size="sm" reviewCount={completedTrips} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Stat icon={<Truck className="w-3.5 h-3.5" />} value={`${fleetSize}`} label="شاحنة" />
            <Stat icon={<Clock className="w-3.5 h-3.5" />} value={`${responseTimeMins} د`} label="استجابة" />
            <Stat icon={<ShieldCheck className="w-3.5 h-3.5" />} value={insurance ? 'مؤمّن' : '—'} label="تأمين" ok={insurance} />
          </div>
        </div>
        {selected && (
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white grid place-items-center">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
    </button>
  );
}

function Stat({ icon, value, label, ok }: { icon: React.ReactNode; value: string; label: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
      <span className={cn('shrink-0', ok && 'text-success')}>{icon}</span>
      <span className="truncate">
        <span className="font-num font-semibold text-foreground">{value}</span>
        <span className="ms-1 text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
