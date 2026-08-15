import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, X } from 'lucide-react';

interface ShortcutCheatsheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open Command Palette' },
  { keys: ['⌘', 'N'], description: 'Create New Idea' },
  { keys: ['?'], description: 'Toggle this Cheatsheet' },
  { keys: ['esc'], description: 'Close Modals/Drawers' },
];

export const ShortcutCheatsheet: React.FC<ShortcutCheatsheetProps> = ({ isOpen, onClose }) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
            className="relative w-full max-w-md bg-surface border border-outline-variant rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/50 bg-surface-container-lowest">
              <div className="flex items-center gap-2 text-on-surface">
                <Command className="w-4 h-4 text-primary" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-widest">Keyboard Shortcuts</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-1 bg-surface-container-lowest/30">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
                  <span className="text-sm text-on-surface-variant">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, kIdx) => (
                      <kbd 
                        key={kIdx} 
                        className="px-2 py-1 bg-surface-container-high border border-outline-variant rounded text-xs font-mono text-on-surface shadow-sm min-w-[24px] text-center"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-surface-container text-center border-t border-outline-variant/50">
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Foundry UI v1.0</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
