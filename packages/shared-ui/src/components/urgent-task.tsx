import * as React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from './button';
import { cn } from '../utils/cn';

export type UrgentPriority = 'critical' | 'high' | 'medium' | 'low';

export interface UrgentTaskItemProps {
  priority: UrgentPriority;
  icon?: React.ReactNode;
  title: string;
  reference?: string;
  company?: string;
  timing?: string;
  amount?: string;
  onClick?: () => void;
  className?: string;
}

const BORDER_CLASS: Record<UrgentPriority, string> = {
  critical: 'border-s-4 border-s-destructive',
  high:     'border-s-4 border-s-destructive',
  medium:   'border-s-4 border-s-warning',
  low:      'border-s-4 border-s-success',
};

const ICON_CLASS: Record<UrgentPriority, string> = {
  critical: 'bg-destructive/15 text-destructive ring-destructive/30',
  high:     'bg-destructive/15 text-destructive ring-destructive/30',
  medium:   'bg-warning/15 text-warning ring-warning/30',
  low:      'bg-success/15 text-success ring-success/30',
};

/**
 * IBP-aligned urgent task row.
 *   - rounded-lg bg-muted/30 p-3 + colored border-s
 *   - Icon in 10×10 rounded-xl with tone + ring
 *   - Title + colored reference (font-mono)
 *   - Company / timing / amount inline · separated
 *   - "Open task" trailing button (outline, sm)
 */
export function UrgentTaskItem({
  priority, icon, title, reference, company, timing, amount, onClick, className,
}: UrgentTaskItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg bg-muted/30 p-3',
        BORDER_CLASS[priority],
        onClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
        className,
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl ring-1 shrink-0', ICON_CLASS[priority])}>
        <div className="h-4 w-4">{icon ?? <Clock className="h-4 w-4" />}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {reference && (
            <span className="text-xs font-mono text-muted-foreground">· {reference}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {company}
          {timing && <span className="mx-1.5">· {timing}</span>}
          {amount && <span className="mx-1.5 font-semibold text-foreground">· {amount}</span>}
        </div>
      </div>

      <Button size="sm" variant="outline" className="shrink-0" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
        <span className="hidden sm:inline">فتح المهمة</span>
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
      </Button>
    </div>
  );
}
