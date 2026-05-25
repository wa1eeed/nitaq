import * as React from 'react';
import { cn } from '../utils/cn';

export interface CurrencyProps {
  amount: number | null | undefined;
  unit?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  fractionDigits?: 0 | 2;
  className?: string;
}

const SIZES = {
  xs:   'text-xs',
  sm:   'text-sm',
  md:   'text-sm',
  lg:   'text-base font-semibold',
  xl:   'text-lg font-semibold',
  '2xl':'text-xl font-bold',
  '3xl':'text-2xl font-bold',
} as const;

const UNIT_SIZES = {
  xs:   'text-[10px]',
  sm:   'text-[11px]',
  md:   'text-xs',
  lg:   'text-xs',
  xl:   'text-xs',
  '2xl':'text-sm',
  '3xl':'text-sm',
} as const;

/**
 * Currency — Inter tabular-nums for the number + smaller muted unit.
 * Western digits / comma separator for predictable column alignment.
 */
export function Currency({
  amount, unit = 'ر.س.', size = 'md', fractionDigits, className,
}: CurrencyProps) {
  if (amount === null || amount === undefined) {
    return <span className={cn('text-muted-foreground', SIZES[size], className)}>—</span>;
  }
  const fd = fractionDigits ?? (Number.isInteger(amount) ? 0 : 2);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fd,
    maximumFractionDigits: fd,
  }).format(amount);
  return (
    <span className={cn('inline-flex items-baseline gap-1 whitespace-nowrap', className)}>
      <span dir="ltr" className={cn('num text-foreground', SIZES[size])}>
        {formatted}
      </span>
      <span className={cn('font-medium text-muted-foreground', UNIT_SIZES[size])}>{unit}</span>
    </span>
  );
}
