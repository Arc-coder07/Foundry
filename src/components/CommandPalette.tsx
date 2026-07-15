import React, { useEffect, useState, useRef } from "react";
import { Search, Lightbulb, Plus, Moon, Sun, CornerDownLeft, Sparkles } from "lucide-react";
import { WorkspaceItem } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: WorkspaceItem[];
  onSelectItem: (id: string) => void;
  onCreateItem: (type: 'Idea' | 'Research' | 'PRD' | 'Architecture' | 'Experiment') => void;
  toggleTheme: () => void;
  theme: "dark" | "light";
}

export function CommandPalette({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onCreateItem,
  toggleTheme,
  theme
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Command items definition
  const baseCommands = [
    {
      id: "cmd-new-idea",
      title: "New Idea Item",
      description: "Quickly capture a raw product hypothesis",
      action: () => onCreateItem("Idea"),
      icon: <Plus className="w-4 h-4 text-on-surface" />
    },
    {
      id: "cmd-new-research",
      title: "New Research Log",
      description: "Document competitive research, literature, or metrics",
      action: () => onCreateItem("Research"),
      icon: <Plus className="w-4 h-4 text-on-surface" />
    },
    {
      id: "cmd-new-prd",
      title: "New Product Requirements Document",
      description: "Detail feature scopes and product boundaries",
      action: () => onCreateItem("PRD"),
      icon: <Plus className="w-4 h-4 text-on-surface" />
    },
    {
      id: "cmd-toggle-theme",
      title: `Toggle Appearance Theme`,
      description: `Switch workspace into ${theme === "dark" ? "light mode" : "dark mode"}`,
      action: () => toggleTheme(),
      icon: theme === "dark" ? <Sun className="w-4 h-4 text-on-surface" /> : <Moon className="w-4 h-4 text-on-surface" />
    }
  ];

  // Filter items based on query
  const filteredWorkspaceItems = query.trim() === "" 
    ? [] 
    : items.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.summary.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      );

  const matchedCommands = baseCommands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const totalResults = [...matchedCommands, ...filteredWorkspaceItems.map(item => ({
    id: item.id,
    title: item.title,
    description: `${item.type.toUpperCase()} • ${item.summary}`,
    action: () => onSelectItem(item.id),
    icon: <Lightbulb className="w-4 h-4 text-on-surface" />
  }))];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, totalResults.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalResults.length) % Math.max(1, totalResults.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (totalResults[selectedIndex]) {
          totalResults[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, totalResults, onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-[#000000]/50 backdrop-blur-md z-50 flex items-start justify-center pt-[15vh] px-4 transition-all duration-300"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-surface border border-outline-variant rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] transition-all duration-300"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search ideas, commands, or collections..."
            className="flex-1 bg-transparent border-none outline-none text-on-surface text-sm placeholder-on-surface-variant/40"
          />
          <span className="font-mono text-[9px] text-text-muted bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
            ESC TO CLOSE
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {totalResults.length > 0 ? (
            totalResults.map((result, idx) => (
              <button
                key={result.id}
                onClick={() => {
                  result.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-left transition-colors cursor-pointer ${
                  selectedIndex === idx 
                    ? "bg-surface-container border border-outline-variant text-on-surface" 
                    : "text-text-muted hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-center">
                    {result.icon}
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-semibold truncate ${selectedIndex === idx ? "text-on-surface font-bold" : "text-on-surface/90"}`}>
                      {result.title}
                    </p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {result.description}
                    </p>
                  </div>
                </div>
                
                {selectedIndex === idx && (
                  <span className="flex items-center gap-1 text-[9px] font-mono opacity-60 text-on-surface">
                    <span>select</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-text-muted flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 opacity-40 animate-pulse text-on-surface" />
              <div>
                <p className="text-xs font-semibold text-on-surface">No matches found for "{query}"</p>
                <p className="text-[11px] text-text-muted mt-1">Try searching for generic keywords, tags or "New"</p>
              </div>
            </div>
          )}
        </div>

        {/* Palette Footer Help Bar */}
        <div className="bg-surface-container-lowest px-4 py-2 border-t border-outline-variant flex items-center justify-between text-[10px] font-mono text-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-container px-1 py-0.5 rounded border border-outline-variant">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-container px-1 py-0.5 rounded border border-outline-variant">Enter</kbd> Select
            </span>
          </div>
          <div>
            <span>Foundry Commander OS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
