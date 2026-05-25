import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

/**
 * shadcn-aligned Badge — same look as IBP.
 * `variant` is shadcn API. Legacy `tone` API kept for compatibility.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary/10 text-primary',
        primary:     'border-transparent bg-primary/10 text-primary',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        success:     'border-transparent bg-success/15 text-success',
        warning:     'border-transparent bg-warning/15 text-warning',
        danger:      'border-transparent bg-destructive/15 text-destructive',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        error:       'border-transparent bg-destructive/15 text-destructive',
        info:        'border-transparent bg-info/15 text-info',
        violet:      'border-transparent bg-violet/15 text-violet',
        neutral:     'border-transparent bg-muted text-muted-foreground',
        outline:     'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type Variant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Legacy alias for `variant`. */
  tone?: Variant;
}

export function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant: variant ?? tone }), className)} {...props} />;
}

export { badgeVariants };
