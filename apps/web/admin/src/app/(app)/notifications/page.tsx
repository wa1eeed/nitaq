'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  AlertCircle, Bell, Check, CheckCheck, FileText, Inbox, Package, ShieldCheck,
  Sparkles, Truck, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { api, fetcher } from '@/lib/api';
import { notify } from '@/lib/notify';
import { formatRelative, notificationsFor, type NotificationKind } from '@naqla/shared-utils';

type ApiNotification = {
  id: string;
  type: string;
  titleAr?: string;
  bodyAr?: string;
  titleEn?: string;
  bodyEn?: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
};

const ICONS: Record<string, { icon: any; tone: string }> = {
  ORDER_BID:        { icon: Inbox,       tone: 'bg-info/15 text-info' },
  ORDER_ACCEPTED:   { icon: Check,       tone: 'bg-success/15 text-success' },
  ORDER_PICKED_UP:  { icon: Truck,       tone: 'bg-info/15 text-info' },
  ORDER_DELIVERED:  { icon: Package,     tone: 'bg-success/15 text-success' },
  INVOICE_OVERDUE:  { icon: FileText,    tone: 'bg-destructive/15 text-destructive' },
  PAYMENT_RELEASED: { icon: Wallet,      tone: 'bg-success/15 text-success' },
  NEW_OPPORTUNITY:  { icon: Sparkles,    tone: 'bg-primary/10 text-primary' },
  KYC_PENDING:      { icon: ShieldCheck, tone: 'bg-warning/15 text-warning' },
  DISPUTE_NEW:      { icon: AlertCircle, tone: 'bg-destructive/15 text-destructive' },
  ORDER_CREATED:      { icon: Sparkles,    tone: 'bg-primary/10 text-primary' },
  BID_RECEIVED:       { icon: Inbox,       tone: 'bg-info/15 text-info' },
  BID_ACCEPTED:       { icon: Check,       tone: 'bg-success/15 text-success' },
  BID_REJECTED:       { icon: AlertCircle, tone: 'bg-warning/15 text-warning' },
  ORDER_ASSIGNED:     { icon: Truck,       tone: 'bg-info/15 text-info' },
  ORDER_CONFIRMED:    { icon: Check,       tone: 'bg-info/15 text-info' },
  SHIPMENT_STARTED:   { icon: Truck,       tone: 'bg-warning/15 text-warning' },
  SHIPMENT_DELIVERED: { icon: Package,     tone: 'bg-success/15 text-success' },
  PAYMENT_RECEIVED:   { icon: Wallet,      tone: 'bg-success/15 text-success' },
  KYC_APPROVED:       { icon: ShieldCheck, tone: 'bg-success/15 text-success' },
  KYC_REJECTED:       { icon: ShieldCheck, tone: 'bg-destructive/15 text-destructive' },
  DISPUTE_OPENED:     { icon: AlertCircle, tone: 'bg-destructive/15 text-destructive' },
  DISPUTE_RESOLVED:   { icon: Check,       tone: 'bg-success/15 text-success' },
  SYSTEM:             { icon: Bell,        tone: 'bg-muted text-muted-foreground' },
};

export default function AdminNotificationsPage() {
  const { data, mutate } = useSWR<{ items?: ApiNotification[]; data?: ApiNotification[]; unread?: number } | ApiNotification[]>(
    '/notifications',
    fetcher,
  );

  const items = useMemo(() => {
    const apiItems: ApiNotification[] = Array.isArray(data)
      ? data
      : ((data as { items?: ApiNotification[] })?.items
         ?? (data as { data?: ApiNotification[] })?.data
         ?? []);
    if (apiItems.length > 0) {
      return apiItems.map((n) => ({
        id: n.id,
        kind: n.type as NotificationKind,
        title: n.titleAr ?? n.titleEn ?? n.type,
        body: n.bodyAr ?? n.bodyEn ?? '',
        at: n.createdAt,
        read: n.isRead,
        href: (n.data as { link?: string } | null | undefined)?.link,
      }));
    }
    return notificationsFor('admin');
  }, [data]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      await mutate();
    } catch (err) {
      notify.error(err, 'فشل تحديث الإشعار');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all', {});
      await mutate();
      notify.success('تم وضع كل الإشعارات كمقروءة');
    } catch (err) {
      notify.error(err, 'فشل العملية');
    }
  };

  return (
    <>
      <PageHeader
        title="مركز الإشعارات"
        subtitle={`${unread} إشعار غير مقروء`}
        actions={
          unread > 0 && (
            <Button variant="outline" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" /> تعليم الكل كمقروء
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-40" />
              لا توجد إشعارات
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => {
                const meta = ICONS[n.kind] ?? ICONS.SYSTEM;
                const Icon = meta.icon;
                const content = (
                  <div
                    className={cn(
                      'flex items-start gap-3 p-4 hover:bg-muted/40 transition-colors cursor-pointer',
                      !n.read && 'bg-primary/5',
                    )}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', meta.tone)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{n.title}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.at)}</p>
                    </div>
                  </div>
                );
                return n.href ? <Link key={n.id} href={n.href}>{content}</Link> : <div key={n.id}>{content}</div>;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
