'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-3 pb-6 border-b border-border md:flex-row md:items-end md:justify-between"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 tracking-tight">{title}</h1>
        {subtitle && <p className="text-label text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
