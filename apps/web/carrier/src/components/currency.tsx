import { cn } from '@/lib/utils';

export interface CurrencyProps {
  amount: number | null | undefined;
  unit?: string;
  className?: string;
}

/**
 * Inline currency renderer — Inter tabular-nums for the figure, muted unit.
 * Western digits + comma thousands for column alignment.
 */
export function Currency({ amount, unit = 'ر.س.', className }: CurrencyProps) {
  if (amount === null || amount === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
  return (
    <span className={cn('inline-flex items-baseline gap-1 whitespace-nowrap', className)}>
      <span dir="ltr" className="num font-medium">{formatted}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </span>
  );
}
