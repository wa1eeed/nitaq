import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

/* ─── Loading ──────────────────────────────────────────────────── */

export function LoadingState({ label = 'جارٍ التحميل...', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16 text-muted-foreground', className)}>
      <Loader2 className="w-5 h-5 me-2 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/* ─── Empty ────────────────────────────────────────────────────── */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 px-4 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-xl grid place-items-center mb-4 bg-muted text-muted-foreground">
          <div className="w-7 h-7">{icon}</div>
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
