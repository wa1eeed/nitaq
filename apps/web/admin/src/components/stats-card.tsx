import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const TONES = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger:  'bg-destructive/15 text-destructive',
} as const;

export function StatsCard({ label, value, hint, icon: Icon, tone = 'default' }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shrink-0', TONES[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
