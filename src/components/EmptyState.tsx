import React from 'react';
import { motion } from 'motion/react';
import { FileQuestion, FolderOpen, Archive, Image as ImageIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  type: 'ideas' | 'collections' | 'archive' | 'moodboard' | 'generic';
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, title, description, children }) => {
  const config = {
    ideas: {
      icon: <Sparkles className="w-12 h-12 text-primary/50" />,
      defaultTitle: "Your think pool is currently empty",
      defaultDescription: "Capturing your first idea is just a click away."
    },
    collections: {
      icon: <FolderOpen className="w-12 h-12 text-blue-500/50" />,
      defaultTitle: "This collection view is empty",
      defaultDescription: "Tap below to capture a new thought opportunity or adjust your filters."
    },
    archive: {
      icon: <Archive className="w-12 h-12 text-text-muted/50" />,
      defaultTitle: "Archive is empty",
      defaultDescription: "Items you archive will safely rest here."
    },
    moodboard: {
      icon: <ImageIcon className="w-12 h-12 text-purple-500/50" />,
      defaultTitle: "Empty Canvas",
      defaultDescription: "Upload images, screenshots, or paste URLs to build your visual vocabulary."
    },
    generic: {
      icon: <FileQuestion className="w-12 h-12 text-on-surface-variant/50" />,
      defaultTitle: "Nothing here yet",
      defaultDescription: "This space is waiting for your input."
    }
  };

  const { icon, defaultTitle, defaultDescription } = config[type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]"
    >
      <motion.div 
        initial={{ rotate: -5 }}
        animate={{ rotate: 5 }}
        transition={{ repeat: Infinity, repeatType: "reverse", duration: 3, ease: "easeInOut" }}
        className="mb-6 p-4 rounded-full bg-surface-container-high border border-outline-variant/30 shadow-inner"
      >
        {icon}
      </motion.div>
      <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-2 font-mono">
        {title || defaultTitle}
      </h3>
      <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed mb-6">
        {description || defaultDescription}
      </p>
      {children}
    </motion.div>
  );
};

export default EmptyState;
