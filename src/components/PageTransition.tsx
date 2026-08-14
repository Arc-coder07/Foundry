import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  viewKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '', viewKey }) => {
  return (
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`h-full w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
