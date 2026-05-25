import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export interface StepperStep {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface StepperProps {
  steps: StepperStep[];
  current: number;
  onStepClick?: (i: number) => void;
  className?: string;
}

export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((step, i) => {
        const idx = i + 1;
        const Icon = step.icon;
        const isDone = idx < current;
        const isActive = idx === current;
        const isClickable = !!onStepClick && isDone;
        return (
          <React.Fragment key={i}>
            <li className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(idx)}
                className={cn(
                  'shrink-0 w-9 h-9 rounded-full grid place-items-center transition-colors border',
                  isDone && 'bg-primary border-primary text-white hover:bg-primary/90',
                  isActive && 'bg-primary border-primary text-white ring-4 ring-primary/15',
                  !isDone && !isActive && 'bg-card border-border text-muted-foreground',
                  isClickable ? 'cursor-pointer' : 'cursor-default',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> :
                 Icon  ? <Icon className="w-[18px] h-[18px]" /> :
                          <span className="text-sm font-bold num">{idx}</span>}
              </button>
              <div className={cn('text-sm font-medium truncate', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </div>
            </li>
            {i < steps.length - 1 && (
              <li aria-hidden className="flex-1 mx-3">
                <div className={cn('h-px', isDone ? 'bg-primary' : 'bg-border')} />
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}
