'use client';
import * as React from 'react';
import { Bell, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { Avatar } from './avatar';

/* ─── Container — IBP-style h-16 + backdrop-blur ──────────────── */

export function Topbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 backdrop-blur px-4 lg:px-6',
        className,
      )}
    >
      {children}
    </header>
  );
}

/* ─── Search field ────────────────────────────────────────────── */

export const TopbarSearch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, placeholder = 'ابحث...', ...props }, ref) => (
    <div className="flex flex-1 items-center gap-2 max-w-xl">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={ref}
          type="search"
          placeholder={placeholder}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent ps-9 pe-3 py-1 text-sm shadow-sm transition-colors',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            className,
          )}
          {...props}
        />
      </div>
    </div>
  ),
);
TopbarSearch.displayName = 'TopbarSearch';

/* ─── Icon button — matches the bell pattern from IBP ─────────── */

export interface TopbarIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  dot?: boolean;
}

export const TopbarIconButton = React.forwardRef<HTMLButtonElement, TopbarIconButtonProps>(
  ({ className, dot, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-accent transition-colors relative',
        className,
      )}
      {...props}
    >
      {children}
      {dot && (
        <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-destructive" />
      )}
    </button>
  ),
);
TopbarIconButton.displayName = 'TopbarIconButton';

/* ─── Lang toggle ─────────────────────────────────────────────── */

export function TopbarLang({
  lang = 'AR', onToggle, className,
}: { lang?: 'AR' | 'EN'; onToggle?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent transition-colors',
        className,
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
      </svg>
      <span className="num">{lang}</span>
    </button>
  );
}

/* ─── Notifications bell ──────────────────────────────────────── */

export function TopbarBell({
  hasUnread, onClick, className,
}: { hasUnread?: boolean; onClick?: () => void; className?: string }) {
  return (
    <TopbarIconButton onClick={onClick} dot={hasUnread} aria-label="الإشعارات" className={className}>
      <Bell className="h-4 w-4" />
    </TopbarIconButton>
  );
}

/* ─── User chip ───────────────────────────────────────────────── */

export interface TopbarUserProps {
  name: string;
  role?: string;
  onClick?: () => void;
  className?: string;
}

export function TopbarUser({ name, role, onClick, className }: TopbarUserProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 ps-2 ms-1 border-s rounded-md transition-colors hover:bg-accent/40 px-2',
        className,
      )}
    >
      <Avatar name={name} size={36} />
      <div className="hidden md:flex flex-col leading-tight items-start">
        <span className="text-sm font-medium text-foreground">{name}</span>
        {role && <span className="text-xs text-muted-foreground">{role}</span>}
      </div>
    </button>
  );
}
