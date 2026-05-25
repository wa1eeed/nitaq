'use client';
import { useEffect, useState } from 'react';
import { Clock, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Currency } from '@/components/currency';
import {
  COMMISSION_RATE,
  ESCROW_AUTO_RELEASE_HOURS,
  escrowAutoReleaseAt,
  escrowBreakdown,
  escrowMsRemaining,
} from '@naqla/shared-utils';

interface EscrowCountdownProps {
  deliveredAt: Date | string;
  total: number;
}

/**
 * Carrier-facing version of the escrow countdown. Same engine as the client
 * component, but framed around "incoming payout" rather than "awaiting your
 * confirmation". Shown on DELIVERED orders.
 */
export function EscrowCountdown({ deliveredAt, total }: EscrowCountdownProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft = escrowMsRemaining(deliveredAt, now) ?? 0;
  const releaseAt = escrowAutoReleaseAt(deliveredAt)!;
  const breakdown = escrowBreakdown(total);
  const elapsed = ESCROW_AUTO_RELEASE_HOURS * 3600 * 1000 - msLeft;
  const pct = Math.min(100, Math.max(0, (elapsed / (ESCROW_AUTO_RELEASE_HOURS * 3600 * 1000)) * 100));

  const hours = Math.floor(msLeft / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);
  const secs = Math.floor((msLeft % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <Card className="border-success/30 bg-success/[0.04]">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-success/15 text-success grid place-items-center shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">دفعتك قادمة</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              المبلغ سيُحوَّل لمحفظتك تلقائياً بعد 72 ساعة من التسليم — أو فور تأكيد العميل (أيهما أسبق).
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-background border p-4">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            المتبقّي للإفراج التلقائي
          </div>
          <div className="flex items-baseline gap-2 font-mono num" dir="ltr">
            <span className="text-2xl font-bold">{pad(hours)}</span>
            <span className="text-muted-foreground">س</span>
            <span className="text-2xl font-bold">{pad(mins)}</span>
            <span className="text-muted-foreground">د</span>
            <span className="text-2xl font-bold">{pad(secs)}</span>
            <span className="text-muted-foreground">ث</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-success transition-[width]" style={{ width: `${pct}%` }} aria-hidden />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            الإفراج المتوقّع:{' '}
            <span className="num" dir="ltr">
              {releaseAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-background border p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">
            ما ستستلمه
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">قيمة الطلب</dt>
              <dd className="font-medium"><Currency amount={breakdown.total} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">عمولة المنصة ({Math.round(COMMISSION_RATE * 100)}%)</dt>
              <dd className="font-medium text-muted-foreground">−<Currency amount={breakdown.commission} /></dd>
            </div>
            <div className="flex justify-between pt-2 mt-1 border-t font-bold text-lg">
              <dt>صافي محفظتك</dt>
              <dd className="text-success"><Currency amount={breakdown.carrierAmount} /></dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
