import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  type: 'list' | 'editor' | 'copilot';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ type }) => {
  const pulseTransition = {
    repeat: Infinity,
    repeatType: "reverse" as const,
    duration: 1,
    ease: "easeInOut"
  };

  if (type === 'list') {
    return (
      <div className="space-y-4 py-4 w-full h-full max-w-2xl mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={pulseTransition}
            className="w-full h-24 bg-surface-container rounded-xl border border-outline-variant/30"
          />
        ))}
      </div>
    );
  }

  if (type === 'copilot') {
    return (
      <div className="space-y-6 py-6 w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={pulseTransition}
          className="w-3/4 h-8 bg-surface-container rounded-lg"
        />
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ ...pulseTransition, delay: 0.1 }}
            className="w-full h-4 bg-surface-container rounded"
          />
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ ...pulseTransition, delay: 0.2 }}
            className="w-full h-4 bg-surface-container rounded"
          />
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ ...pulseTransition, delay: 0.3 }}
            className="w-5/6 h-4 bg-surface-container rounded"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8 w-full">
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={pulseTransition}
        className="w-1/2 h-12 bg-surface-container rounded-lg"
      />
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ ...pulseTransition, delay: 0.1 }}
          className="w-full h-32 bg-surface-container rounded-xl"
        />
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ ...pulseTransition, delay: 0.2 }}
          className="w-full h-32 bg-surface-container rounded-xl"
        />
      </div>
    </div>
  );
};
