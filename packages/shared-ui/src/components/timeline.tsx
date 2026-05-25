import * as React from 'react';
import { cn } from '../utils/cn';

export interface TimelineItem {
  icon?: React.ReactNode;
  title: string;
  time?: string;
  description?: string;
  by?: string;
  state?: 'done' | 'active' | 'upcoming' | 'cancelled';
}

const stateStyles: Record<NonNullable<TimelineItem['state']>, { dot: string; line: string; title: string }> = {
  done:      { dot: 'bg-primary text-white border-primary',                      line: 'bg-primary/60',  title: 'text-foreground' },
  active:    { dot: 'bg-accent text-primary border-accent ring-4 ring-accent/15', line: 'bg-border',      title: 'text-foreground font-semibold' },
  upcoming:  { dot: 'bg-muted text-muted-foreground border-border',                  line: 'bg-border-subtle', title: 'text-muted-foreground' },
  cancelled: { dot: 'bg-destructive/15 text-destructive border-destructive/30',                    line: 'bg-destructive/30',     title: 'text-destructive' },
};

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, i) => {
        const state = item.state ?? 'done';
        const s = stateStyles[state];
        const isLast = i === items.length - 1;
        return (
          <li key={i} className="relative ps-10 pb-5 last:pb-0">
            {!isLast && <span aria-hidden className={cn('absolute top-7 bottom-0 start-3 w-px', s.line)} />}
            <span className={cn('absolute start-0 top-1 grid place-items-center w-6 h-6 rounded-full border-2', s.dot)}>
              {item.icon ? <span className="w-3 h-3">{item.icon}</span> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            </span>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={cn('text-base leading-snug', s.title)}>{item.title}</div>
                {(item.description || item.by) && (
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                    {item.description && item.by && ' · '}
                    {item.by && <span>{item.by}</span>}
                  </div>
                )}
              </div>
              {item.time && <div className="text-xs text-muted-foreground shrink-0 whitespace-nowrap mt-0.5">{item.time}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
