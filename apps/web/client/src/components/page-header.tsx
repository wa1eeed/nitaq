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
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 pb-6 border-b border-border md:flex-row md:items-end md:justify-between"
    >
      <div className="flex flex-col gap-1">
        <div className="relative inline-block">
          <h1 className="text-h1 tracking-tight">{title}</h1>
          {/* Gradient underline */}
          <span
            className="absolute -bottom-1 left-0 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#0A3D3A] to-[#0D5C57]"
            aria-hidden
          />
        </div>
        {subtitle && (
          <p className="text-label text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
