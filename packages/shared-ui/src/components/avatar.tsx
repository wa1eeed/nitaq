'use client';
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../utils/cn';

/* ─── shadcn primitives ────────────────────────────────────────── */

export const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
AvatarRoot.displayName = 'AvatarRoot';

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex h-full w-full items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-medium', className)}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

/* ─── App-facing wrapper: <Avatar name="..." size={32} /> ──────── */

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  size?: 24 | 28 | 32 | 36 | 40 | 48;
}

export function Avatar({ name = '', src, size = 36, className, style, ...props }: AvatarProps) {
  const initials = React.useMemo(
    () =>
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase(),
    [name],
  );
  return (
    <div
      style={{ width: size, height: size, ...style }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-primary/15 text-primary overflow-hidden shrink-0',
        size <= 24 ? 'text-[10px]' : size <= 32 ? 'text-xs' : size <= 40 ? 'text-sm' : 'text-base',
        'font-medium',
        className,
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || '—'}</span>
      )}
    </div>
  );
}
