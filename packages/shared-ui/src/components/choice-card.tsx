import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ChoiceCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  selected?: boolean;
  badge?: string;
}

export const ChoiceCard = React.forwardRef<HTMLButtonElement, ChoiceCardProps>(
  ({ className, icon, title, description, selected, badge, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        'group relative w-full text-start p-5 rounded-lg border-2 transition-all duration-150',
        'flex items-start gap-4 focus-ring',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className={cn(
          'shrink-0 w-12 h-12 rounded-lg grid place-items-center transition-colors',
          selected ? 'bg-primary text-white' : 'bg-primary/10 text-primary',
        )}>
          <div className="w-6 h-6">{icon}</div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {badge && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <span className={cn(
        'shrink-0 w-6 h-6 rounded-full border-2 grid place-items-center transition-all',
        selected ? 'bg-primary border-primary text-white' : 'border-border bg-card',
      )}>
        {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
    </button>
  ),
);
ChoiceCard.displayName = 'ChoiceCard';
