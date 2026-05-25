import * as React from 'react';
import { cn } from '../utils/cn';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';

export interface AuthFeature {
  icon: React.ReactNode;
  label: string;
}

export interface AuthSplitLayoutProps {
  rolePill?: string;
  tagline?: string;
  taglineSub?: string;
  features?: AuthFeature[];
  children: React.ReactNode;
  className?: string;
}

export function AuthSplitLayout({
  rolePill, tagline = 'منصة النقل الذكي في المملكة',
  taglineSub = 'وسيط رقمي يربط الشركات والأفراد بأفضل ناقلي المملكة — بشفافية كاملة في الأسعار والتتبع والمدفوعات.',
  features, children, className,
}: AuthSplitLayoutProps) {
  return (
    <div className={cn('min-h-screen flex flex-col-reverse lg:flex-row bg-background', className)}>
      {/* Brand panel (right in RTL) */}
      <aside className="hidden lg:flex relative overflow-hidden lg:w-[44%] xl:w-[42%] bg-primary text-white">
        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -start-40 w-[520px] h-[520px] bg-accent/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14">
          <div className="flex items-center justify-between gap-4">
            <Logo tone="inverted" size={32} />
            {rolePill && (
              <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                {rolePill}
              </span>
            )}
          </div>
          <div className="max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">{tagline}</h2>
            <p className="mt-5 text-white/70 text-md xl:text-lg leading-relaxed">{taglineSub}</p>
          </div>
          {features && features.length > 0 && (
            <ul className="space-y-3.5 pt-8 border-t border-white/10">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/15 text-accent ring-1 ring-accent/20">
                    {f.icon}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 lg:px-10 py-5">
          <div className="lg:hidden"><Logo size={24} /></div>
          <ThemeToggle className="ms-auto" />
        </header>
        <div className="flex-1 flex items-center justify-center px-6 pb-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <footer className="px-6 lg:px-10 py-5 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} نقلة لوجيستك · جميع الحقوق محفوظة
        </footer>
      </main>
    </div>
  );
}
