import * as React from 'react';
import { Card, CardContent } from './card';
import { cn } from '../utils/cn';

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  /** Compatibility alias for `hint`. */
  subLabel?: string;
  hint?: string;
  icon?: React.ReactNode;
  /** IBP tones: default | success | warning | danger. */
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'emerald' | 'blue' | 'amber' | 'red' | 'violet';
  trend?: { value: number; positive?: boolean };
}

const TONES: Record<string, string> = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  emerald: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  amber:   'bg-warning/15 text-warning',
  danger:  'bg-destructive/15 text-destructive',
  red:     'bg-destructive/15 text-destructive',
  blue:    'bg-info/15 text-info',
  violet:  'bg-violet/15 text-violet',
};

/**
 * IBP-aligned stats card.
 *   - Card shell (rounded-xl border shadow-sm)
 *   - Padding via CardContent pt-6
 *   - Label: text-sm font-medium muted
 *   - Value: text-2xl font-bold tracking-tight
 *   - Hint:  text-xs muted
 *   - Icon:  h-11 w-11 rounded-xl tone-colored, top-end
 */
export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, label, value, subLabel, hint, icon, tone = 'default', trend, ...props }, ref) => {
    const toneClass = TONES[tone] ?? TONES.default;
    const hintText = hint ?? subLabel;
    return (
      <Card ref={ref} className={className} {...props}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              {typeof value === 'string' || typeof value === 'number' ? (
                <p className="text-2xl font-bold tracking-tight text-foreground num">{value}</p>
              ) : (
                <div className="text-2xl font-bold tracking-tight">{value}</div>
              )}
              {hintText && <p className="text-xs text-muted-foreground">{hintText}</p>}
              {trend && (
                <p className={cn('text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
                  {trend.positive ? '▲' : '▼'} {Math.abs(trend.value)}%
                </p>
              )}
            </div>
            {icon && (
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shrink-0', toneClass)}>
                <div className="h-5 w-5">{icon}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
);
StatsCard.displayName = 'StatsCard';
