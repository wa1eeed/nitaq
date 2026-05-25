import { cn } from '@/lib/utils';

interface PulsingBadgeProps {
  count: number;
  /** color theme — defaults to red (urgent). */
  tone?: 'red' | 'amber' | 'primary';
  /** When false, render nothing if count is 0 (useful in sidebars). */
  hideWhenZero?: boolean;
  /** Compact = no ping ring (for tight tab placements). */
  compact?: boolean;
  className?: string;
  /** Optional aria-label override */
  'aria-label'?: string;
}

/**
 * Animated counter badge with a soft pulsing ring around it. Used to draw
 * carriers' attention to incoming order opportunities, and to flag unread
 * notifications. The pulse is CSS-only (Tailwind's `animate-ping`) so it's
 * cheap and works without JS state.
 *
 *   <PulsingBadge count={4} />               // red, ring, hides at 0
 *   <PulsingBadge count={n} compact />       // tighter, no ring
 *   <PulsingBadge count={2} tone="amber" />  // counter-offer pending
 */
export function PulsingBadge({
  count,
  tone = 'red',
  hideWhenZero = true,
  compact = false,
  className,
  'aria-label': ariaLabel,
}: PulsingBadgeProps) {
  if (count <= 0 && hideWhenZero) return null;

  const palette = {
    red:     { ring: 'bg-red-500',     dot: 'bg-red-500',     text: 'text-white' },
    amber:   { ring: 'bg-amber-500',   dot: 'bg-amber-500',   text: 'text-white' },
    primary: { ring: 'bg-primary',     dot: 'bg-primary',     text: 'text-primary-foreground' },
  }[tone];

  const display = count > 99 ? '99+' : String(count);

  return (
    <span
      className={cn('relative inline-flex items-center justify-center', className)}
      aria-label={ariaLabel ?? `${count} new`}
      role="status"
    >
      {!compact && (
        <span
          aria-hidden
          className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', palette.ring)}
        />
      )}
      <span
        className={cn(
          'relative inline-flex items-center justify-center rounded-full font-semibold num shadow-sm',
          compact ? 'min-w-[18px] h-[18px] px-1 text-[10px]' : 'min-w-[22px] h-[22px] px-1.5 text-[11px]',
          palette.dot,
          palette.text,
        )}
      >
        {display}
      </span>
    </span>
  );
}
