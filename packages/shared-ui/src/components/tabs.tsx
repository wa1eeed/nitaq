'use client';
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../utils/cn';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

/* ─── Segmented filter (used in apps' list pages) ─────────────── */

export interface TabFilterItem {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface TabsFilterProps {
  items: TabFilterItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export function TabsFilter({ items, value, onChange, className }: TabsFilterProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {items.map((item) => {
        const active = item.key === value;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'inline-flex items-center gap-2 h-7 px-3 rounded-md text-xs font-medium transition-all',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded text-[10px] font-semibold num',
                  active ? 'bg-primary/10 text-primary' : 'bg-card/80 text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
