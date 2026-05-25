'use client';
import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircle, Bell, Check, FileText, Inbox, Package, ShieldCheck, Sparkles, Truck, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { notificationsFor, type AppNotification, type NotificationKind, formatRelative } from '@naqla/shared-utils';

const ICONS: Record<NotificationKind, { icon: any; tone: string }> = {
  ORDER_BID:        { icon: Inbox,       tone: 'bg-info/15 text-info' },
  ORDER_ACCEPTED:   { icon: Check,       tone: 'bg-success/15 text-success' },
  ORDER_PICKED_UP:  { icon: Truck,       tone: 'bg-info/15 text-info' },
  ORDER_DELIVERED:  { icon: Package,     tone: 'bg-success/15 text-success' },
  INVOICE_OVERDUE:  { icon: FileText,    tone: 'bg-destructive/15 text-destructive' },
  PAYMENT_RELEASED: { icon: Wallet,      tone: 'bg-success/15 text-success' },
  NEW_OPPORTUNITY:  { icon: Sparkles,    tone: 'bg-primary/10 text-primary' },
  KYC_PENDING:      { icon: ShieldCheck, tone: 'bg-warning/15 text-warning' },
  DISPUTE_NEW:      { icon: AlertCircle, tone: 'bg-destructive/15 text-destructive' },
};

export interface NotificationCenterProps {
  audience: 'admin' | 'client' | 'carrier';
}

export function NotificationCenter({ audience }: NotificationCenterProps) {
  const items = React.useMemo(() => notificationsFor(audience), [audience]);
  const [open, setOpen] = React.useState(false);
  const [readIds, setReadIds] = React.useState<Set<string>>(
    () => new Set(items.filter((n) => n.read).map((n) => n.id)),
  );

  const unreadCount = items.filter((n) => !readIds.has(n.id)).length;
  const markAllRead = () => setReadIds(new Set(items.map((n) => n.id)));
  const markRead = (id: string) => setReadIds((s) => new Set([...s, id]));

  // Play subtle chime when the unread count goes UP (i.e. a new notification
  // arrived). Skips the first render so we don't chime on initial mount.
  const lastUnreadRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (lastUnreadRef.current !== null && unreadCount > lastUnreadRef.current) {
      // Lazy-load to avoid SSR / module-resolution issues
      import('@/lib/sound').then(({ playSoundIfEnabled }) => playSoundIfEnabled('notification'));
    }
    lastUnreadRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="الإشعارات">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 text-base">الإشعارات</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
              لا توجد إشعارات
            </div>
          ) : (
            items.map((n) => <Row key={n.id} n={n} read={readIds.has(n.id)} onClick={() => { markRead(n.id); setOpen(false); }} />)
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />
        <div className="p-2">
          <Link href="/notifications" className="block">
            <Button variant="ghost" className="w-full justify-center text-sm" size="sm" onClick={() => setOpen(false)}>
              عرض كل الإشعارات
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Row({ n, read, onClick }: { n: AppNotification; read: boolean; onClick: () => void }) {
  const meta = ICONS[n.kind];
  const Icon = meta.icon;
  const content = (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer',
        !read && 'bg-primary/5',
      )}
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', meta.tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{n.title}</span>
          {!read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{n.body}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{formatRelative(n.at)}</p>
      </div>
    </div>
  );
  return n.href ? <Link href={n.href}>{content}</Link> : content;
}
