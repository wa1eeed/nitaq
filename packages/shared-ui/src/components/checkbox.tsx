'use client';
import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-[6px] border border-border bg-card',
      'transition-colors',
      'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white',
      'dark:data-[state=checked]:text-primary',
      'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(10,61,58,.15)]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="w-3.5 h-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';
