'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const TONES = {
  default: {
    icon: 'bg-primary/10 text-primary',
    bar:  'from-[#0A3D3A] to-[#0D5C57]',
  },
  success: {
    icon: 'bg-success/15 text-success',
    bar:  'from-[#00C9A7] to-[#00A88A]',
  },
  warning: {
    icon: 'bg-warning/15 text-warning',
    bar:  'from-[#F0C040] to-[#E6A817]',
  },
  danger: {
    icon: 'bg-destructive/15 text-destructive',
    bar:  'from-red-500 to-red-700',
  },
} as const;

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) { setCount(end); return; }
    const duration = 1200;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count.toLocaleString('ar-SA')}</>;
}

export function StatsCard({ label, value, hint, icon: Icon, tone = 'default' }: StatsCardProps) {
  const t = TONES[tone];
  const numericValue = typeof value === 'number' ? value : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden">
        {/* Colored top bar */}
        <div className={cn('h-1 w-full bg-gradient-to-r', t.bar)} />
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="text-2xl font-bold tracking-tight">
                {numericValue !== null ? (
                  <AnimatedCounter value={numericValue} />
                ) : (
                  value
                )}
              </div>
              {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl shrink-0', t.icon)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
