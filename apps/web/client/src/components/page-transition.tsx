'use client';
import { motion } from 'framer-motion';

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1];

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease, staggerChildren: 0.06 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function FadeItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
