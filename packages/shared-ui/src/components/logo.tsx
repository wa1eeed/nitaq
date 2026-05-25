import * as React from 'react';
import { cn } from '../utils/cn';

export interface LogoProps {
  /** Mark size in pixels. */
  size?: 24 | 28 | 32 | 40 | 56;
  showText?: boolean;
  className?: string;
  /** Force a color tone (defaults to following theme via tokens). */
  tone?: 'default' | 'inverted';
}

const TEXT_SIZE: Record<number, string> = {
  24: 'text-base',
  28: 'text-lg',
  32: 'text-xl',
  40: 'text-2xl',
  56: 'text-3xl',
};

/**
 * نقلة logo — brand mark (3 stacked lines + gold dot) + word-mark.
 * The mark adapts to the current theme via primary/accent tokens.
 */
export function Logo({ size = 32, showText = true, tone = 'default', className }: LogoProps) {
  const textClass = tone === 'inverted' ? 'text-white' : 'text-foreground';
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)} dir="rtl">
      <LogoMark size={size} />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn('font-bold tracking-tight', TEXT_SIZE[size] ?? 'text-xl', textClass)}>نقلة</span>
          <span className="text-xs font-medium tracking-tight text-accent -mt-0.5">لوجيستك</span>
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="نقلة لوجيستك"
    >
      <rect x="4" y="12" width="36" height="4" rx="2" className="fill-accent" />
      <circle cx="4" cy="14" r="4" className="fill-gold" />
      <rect x="14" y="22" width="26" height="4" rx="2" className="fill-accent" />
      <rect x="24" y="32" width="16" height="4" rx="2" className="fill-accent" />
    </svg>
  );
}
