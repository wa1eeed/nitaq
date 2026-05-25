'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  AlertCircle, BarChart3, Bell, Building2, FileText, History, LayoutDashboard,
  LifeBuoy, Megaphone, Scale, Search, Settings, ShieldCheck, Truck, Users, Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { usePlatformStore } from '@/stores/platform-store';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Nav structure with translation KEYS (not literal strings). The component
 * resolves them via `useTranslations('admin')` so the sidebar fully switches
 * between Arabic and English when the user changes language.
 */
interface NavGroupKey { titleKey: string; items: NavItemKey[] }
interface NavItemKey { href: string; labelKey: string; icon: LucideIcon; comingSoon?: boolean }

const NAV: NavGroupKey[] = [
  {
    titleKey: 'platform',
    items: [
      { href: '/',           labelKey: 'dashboard',   icon: LayoutDashboard },
      { href: '/companies',  labelKey: 'companies',   icon: Building2 },
      { href: '/kyc',        labelKey: 'kyc',         icon: ShieldCheck },
      { href: '/orders',     labelKey: 'orders',      icon: FileText },
      { href: '/disputes',   labelKey: 'disputes',    icon: AlertCircle },
    ],
  },
  {
    titleKey: 'fleet',
    items: [
      { href: '/trucks',  labelKey: 'trucks',  icon: Truck },
      { href: '/drivers', labelKey: 'drivers', icon: Users },
    ],
  },
  {
    titleKey: 'finance',
    items: [
      { href: '/payments', labelKey: 'payments', icon: Wallet },
      { href: '/wallets',  labelKey: 'wallets',  icon: Wallet },
    ],
  },
  {
    titleKey: 'system',
    items: [
      { href: '/reports',       labelKey: 'reports',       icon: BarChart3 },
      { href: '/support',       labelKey: 'support',       icon: LifeBuoy },
      { href: '/notifications', labelKey: 'notifications', icon: Bell },
      { href: '/promotions',    labelKey: 'promotions',    icon: Megaphone },
      { href: '/audit',         labelKey: 'audit',         icon: History },
    ],
  },
  {
    titleKey: 'legalSeo',
    items: [
      { href: '/legal', labelKey: 'legal', icon: Scale },
      { href: '/seo',   labelKey: 'seo',   icon: Search },
    ],
  },
  {
    titleKey: 'settings',
    items: [
      { href: '/settings', labelKey: 'settings', icon: Settings },
    ],
  },
];

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname() ?? '/';
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  // Live-reads the admin's custom brand name (falls back to t('appName')).
  const brandNameAr = usePlatformStore((s) => s.nameAr);
  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b">
        <Logo />
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight">{brandNameAr || t('appName')}</span>
          <span className="text-xs text-muted-foreground">{t('appSubtitle')}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
        {NAV.map((group) => (
          <div key={group.titleKey} className="flex flex-col gap-1">
            <div className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`groups.${group.titleKey}`)}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{t(`nav.${item.labelKey}`)}</span>
                  {item.comingSoon && (
                    <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                      {tc('comingSoon')}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>


    </>
  );
}

/**
 * Desktop sidebar — visible on lg+, fixed left/start, 288px wide.
 */
export function AppSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-e bg-card h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}
