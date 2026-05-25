import * as React from 'react';
import { cn } from '../utils/cn';

/* ─── InfoRow / InfoList — for detail panels ──────────────────── */

export interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function InfoRow({ label, value, icon, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-3', className)}>
      <dt className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-base font-medium text-foreground text-end shrink-0 max-w-[60%]">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

export function InfoList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn('divide-y divide-border', className)}>{children}</dl>;
}
