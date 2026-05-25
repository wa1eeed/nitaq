'use client';
import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../utils/cn';

const STORAGE_KEY = 'naqla-theme';
type Theme = 'light' | 'dark';

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', t === 'dark');
}

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = readTheme();
    setTheme(t);
    applyTheme(t);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-accent transition-colors',
        className,
      )}
    >
      {mounted && theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
