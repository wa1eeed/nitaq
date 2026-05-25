import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: 'coming-soon' | string;
  exact?: boolean;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  brand: React.ReactNode;
  groups: SidebarGroup[];
  /** Optional footer block — pass <DemoModeFooter /> or any node. */
  footer?: React.ReactNode;
  currentPath: string;
  linkAs?: React.ElementType;
  className?: string;
}

/**
 * IBP-aligned sidebar.
 *   - w-72 (288px), bg-card, border-e
 *   - Brand strip: 64px tall, border-b
 *   - Sections: uppercase muted label, mb-1.5
 *   - Items: rounded-lg px-3 py-2, gap-3, icon 16px
 *   - Active: bg-primary/10 text-primary
 *   - Hover: bg-muted text-foreground
 */
export function Sidebar({
  brand, groups, footer, currentPath, linkAs: Link = 'a', className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col w-72 shrink-0 border-e bg-card h-screen sticky top-0',
        className,
      )}
    >
      {/* Brand strip — h-16 + border-b */}
      <div className="flex items-center gap-3 px-5 h-16 border-b">{brand}</div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-1">
            <div className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? currentPath === item.href
                : currentPath === item.href ||
                  (item.href !== '/' && currentPath.startsWith(item.href + '/')) ||
                  (item.href !== '/' && currentPath.startsWith(item.href));
              const isComingSoon = item.badge === 'coming-soon';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    isComingSoon && 'cursor-default',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isComingSoon && (
                    <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                      قريباً
                    </span>
                  )}
                  {item.badge && !isComingSoon && (
                    <span className="text-[10px] rounded-full bg-primary/15 text-primary px-1.5 py-0.5 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer (Demo Mode banner or custom) */}
      {footer && <div className="border-t p-3">{footer}</div>}
    </aside>
  );
}

/* ─── Demo Mode banner (matches IBP's sidebar footer) ─────────── */

export interface DemoModeFooterProps {
  title?: string;
  description?: string;
  className?: string;
}

export function DemoModeFooter({
  title = 'Demo Mode',
  description = 'UI-First prototype — mock data only',
  className,
}: DemoModeFooterProps) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg bg-muted/40 p-3', className)}>
      <AlertCircle className="h-5 w-5 text-warning shrink-0" />
      <div className="flex flex-col text-xs leading-snug">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}
