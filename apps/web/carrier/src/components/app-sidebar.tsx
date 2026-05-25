'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  AlertCircle, BarChart3, Bell, Compass, FileCheck2, Gavel, LayoutDashboard,
  LifeBuoy, Package, Settings, Shield, Truck, Users, Wallet,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

type PlatformBranding = { logoUrl: string; nameAr: string; nameEn: string };
import { useAuthStore } from '@/lib/auth-store';
import { CURRENT_CARRIER_ID, openOpportunitiesForCarrier, normalizeOrderList, type Order } from '@naqla/shared-utils';
import { PulsingBadge } from '@/components/pulsing-badge';
import { cn } from '@/lib/utils';

interface NavItem { href: string; labelKey: string; icon: LucideIcon }
interface NavGroup { titleKey: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    titleKey: 'carrier',
    items: [
      { href: '/',              labelKey: 'dashboard',     icon: LayoutDashboard },
      { href: '/opportunities', labelKey: 'opportunities', icon: Compass },
      { href: '/orders',        labelKey: 'orders',        icon: Package },
      { href: '/bids',          labelKey: 'bids',          icon: Gavel },
    ],
  },
  {
    titleKey: 'fleet',
    items: [
      { href: '/fleet/trucks',  labelKey: 'trucks',  icon: Truck },
      { href: '/fleet/drivers', labelKey: 'drivers', icon: Users },
    ],
  },
  {
    titleKey: 'finance',
    items: [
      { href: '/earnings', labelKey: 'earnings', icon: Wallet },
      { href: '/finance',  labelKey: 'finance',  icon: Wallet },
      { href: '/reports',  labelKey: 'reports',  icon: BarChart3 },
    ],
  },
  {
    titleKey: 'complianceSupport',
    items: [
      { href: '/documents',     labelKey: 'documents',     icon: FileCheck2 },
      { href: '/disputes',      labelKey: 'disputes',      icon: Shield },
      { href: '/support',       labelKey: 'support',       icon: LifeBuoy },
      { href: '/notifications', labelKey: 'notifications', icon: Bell },
    ],
  },
  {
    titleKey: 'settings',
    items: [
      { href: '/settings', labelKey: 'settings', icon: Settings },
    ],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/';
  const t = useTranslations('carrier');
  const { data: branding } = useSWR<PlatformBranding>('/settings/platform', fetcher);
  const logoUrl = branding?.logoUrl ?? '';
  const nameAr  = branding?.nameAr  ?? t('appName');
  const authedCompanyId = useAuthStore((s) => s.user?.companyId);
  const myCompanyId = authedCompanyId ?? CURRENT_CARRIER_ID;
  // Live count of fresh opportunities — orders the carrier HASN'T bid on yet.
  // This must match what the /opportunities list shows under "السوق المفتوح"
  // + "موجّه لشركتي" tabs (excludes orders already in "بانتظار موافقة العميل").
  // SWR dedupes the fetch across pages so the cost is one network request.
  const { data: oppsData } = useSWR<unknown>('/orders', fetcher);
  const openOppsCount = (() => {
    const arr = normalizeOrderList(oppsData);
    const pool: Order[] = arr.length > 0 ? arr : openOpportunitiesForCarrier(CURRENT_CARRIER_ID);
    type O = Order & {
      bids?: Array<{ carrierId: string; status: string }>;
      carrierId?: string;
    };
    return pool.filter((o) => {
      const oo = o as O;
      // Exclude orders already assigned to this carrier — they're not
      // opportunities, they're "my orders". Matches /opportunities filter.
      if (oo.carrierId === myCompanyId && !['DRAFT', 'PUBLISHED', 'BIDDING'].includes(o.status)) {
        return false;
      }
      const bids = oo.bids ?? [];
      return !bids.some((b) => b.carrierId === myCompanyId && b.status === 'PENDING');
    }).length;
  })();

  return (
    <>
      <div className="flex items-center gap-3 px-5 h-16 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground overflow-hidden">
          {logoUrl
            ? <Image src={logoUrl} alt={nameAr} width={36} height={36} className="object-contain" unoptimized />
            : <Truck className="h-5 w-5" />
          }
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight">{nameAr}</span>
          <span className="text-xs text-muted-foreground">{t('appSubtitle')}</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
        {NAV.map((group) => (
          <div key={group.titleKey} className="flex flex-col gap-1">
            <div className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`groups.${group.titleKey}`)}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/');
              const showOppsBadge = item.href === '/opportunities' && openOppsCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-primary/10"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0 relative z-10" />
                  <span className="flex-1 relative z-10">{t(`nav.${item.labelKey}`)}</span>
                  {showOppsBadge && <span className="relative z-10"><PulsingBadge count={openOppsCount} compact /></span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0" />
          <div className="flex flex-col text-xs leading-snug">
            <span className="font-medium">Demo Mode</span>
            <span className="text-muted-foreground">UI-First prototype — mock data only</span>
          </div>
        </div>
      </div>
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-e bg-card h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}
