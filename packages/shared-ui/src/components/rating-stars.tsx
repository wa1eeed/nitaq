import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../utils/cn';

export interface RatingStarsProps {
  value: number;
  showValue?: boolean;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { star: 'w-3.5 h-3.5', text: 'text-xs' },
  md: { star: 'w-4 h-4',     text: 'text-sm' },
  lg: { star: 'w-5 h-5',     text: 'text-md' },
} as const;

export function RatingStars({ value, showValue = true, reviewCount, size = 'md', className }: RatingStarsProps) {
  const s = SIZES[size];
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.25 && value - full < 0.75;
  const fullEffective = value - full >= 0.75 ? full + 1 : full;
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <span className="inline-flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < fullEffective;
          const half = !filled && hasHalf && i === full;
          return (
            <span key={i} className="relative inline-block">
              <Star className={cn(s.star, 'text-gold/30')} fill="currentColor" />
              {(filled || half) && (
                <Star
                  className={cn(s.star, 'absolute inset-0 text-gold')}
                  fill="currentColor"
                  style={half ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
                />
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className={cn('font-num font-semibold text-foreground', s.text)}>{value.toFixed(1)}</span>
      )}
      {typeof reviewCount === 'number' && (
        <span className={cn('font-num text-muted-foreground', s.text)}>({reviewCount.toLocaleString('en-US')})</span>
      )}
    </span>
  );
}
