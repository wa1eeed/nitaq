import * as React from 'react';
import { cn } from '../utils/cn';

/* ─── PageHeader (IBP-aligned) ────────────────────────────────── */

export interface PageHeaderProps {
  title: string;
  /** Compatibility alias for `subtitle`. */
  description?: string;
  subtitle?: string;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * IBP page header.
 *   - flex col on mobile, row + items-end on md+
 *   - pb-6 border-b
 *   - Title: 2xl mobile, 3xl md+, bold tracking-tight
 *   - Subtitle: text-sm muted
 */
export function PageHeader({
  title, description, subtitle, eyebrow, actions, className,
}: PageHeaderProps) {
  const sub = subtitle ?? description;
  return (
    <div className={cn('flex flex-col gap-3 pb-6 border-b border-border md:flex-row md:items-end md:justify-between', className)}>
      <div className="flex flex-col gap-1">
        {eyebrow && <div className="text-xs font-medium text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ─── SectionHeader (lighter weight, used above tables/sections) ─ */

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
