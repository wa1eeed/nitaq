'use client';
import { motion } from 'framer-motion';
import { TableBody, TableRow, TableCell } from '@/components/ui/table';

function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.9, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      className={`h-3 rounded-md bg-muted ${width}`}
    />
  );
}

export function SkeletonTableRows({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c}>
              <SkeletonLine width={c === 0 ? 'w-20' : c === cols - 1 ? 'w-16' : 'w-full'} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

export function SkeletonCard() {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.9, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      className="rounded-2xl border bg-card p-6 space-y-3"
    >
      <div className="h-4 rounded-md bg-muted w-1/3" />
      <div className="h-8 rounded-md bg-muted w-1/2" />
      <div className="h-3 rounded-md bg-muted w-2/3" />
    </motion.div>
  );
}
