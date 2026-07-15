import { 
  Lightbulb, 
  Layers, 
  Pin, 
  Archive, 
  Plus, 
  Sun, 
  Moon, 
  Command,
  Compass,
  Zap
} from "lucide-react";
import { WorkspaceItem, UserProfile } from "../types";

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  items: WorkspaceItem[];
  onCreateItem: (type: 'Idea' | 'Research' | 'PRD' | 'Architecture' | 'Experiment' | 'Task' | 'Launch') => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  onOpenCommandPalette: () => void;
  userProfile: UserProfile;
  onProfileClick: () => void;
}

export function Sidebar({
  currentView,
  setView,
  items,
  onCreateItem,
  theme,
  toggleTheme,
  onOpenCommandPalette,
  userProfile,
  onProfileClick
}: SidebarProps) {
  
  // Calculate counts for badges
  const ideasCount = items.filter(i => i.type === "Idea" && i.status !== "Archived").length;
  const pinnedCount = items.filter(i => i.pinned && i.status !== "Archived").length;
  const collections = Array.from(new Set(items.map(i => i.collection).filter(Boolean)));
  
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest flex flex-col p-7 border-r border-outline-variant z-40 hidden md:flex select-none transition-all duration-300">
      
      {/* Brand Logo & Product Title */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded bg-primary flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4 text-on-primary fill-on-primary" />
        </div>
        <div>
          <h2 className="font-headline text-base font-bold text-on-surface leading-tight tracking-tight">Foundry</h2>
          <p className="font-label-caps text-[9px] text-text-muted uppercase tracking-widest">Product OS</p>
        </div>
      </div>

      {/* Primary Action - Quick Add Menu */}
      <div className="mb-8 relative group">
        <button 
          onClick={() => onCreateItem("Idea")}
          className="flex items-center justify-between w-full px-4 py-3 bg-primary hover:opacity-90 text-on-primary rounded text-xs font-mono font-bold tracking-wider transition-all duration-150 shadow-sm cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            NEW ITEM
          </span>
          <span className="opacity-60 text-[10px]">⌘N</span>
        </button>
        
        {/* Dropdown for item types */}
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-low border border-outline-variant rounded-lg shadow-xl hidden group-hover:block z-50 p-1.5">
          <p className="text-[9px] font-mono text-text-muted px-2.5 py-1.5 uppercase tracking-widest">Select Entry Type</p>
          {(['Idea', 'Research', 'PRD', 'Architecture', 'Experiment'] as const).map(type => (
            <button
              key={type}
              onClick={(e) => {
                e.stopPropagation();
                onCreateItem(type);
              }}
              className="w-full text-left px-2.5 py-2 text-xs text-text-muted hover:text-on-surface hover:bg-surface-container rounded-md transition-colors cursor-pointer font-medium"
            >
              + {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        <p className="text-[9px] font-mono text-text-muted px-2.5 py-1.5 uppercase tracking-wider">NAVIGATE</p>
        
        <button 
          onClick={() => setView("home")}
          className={`flex items-center justify-between px-3.5 py-2.5 w-full rounded-md text-xs transition-all duration-150 cursor-pointer ${
            currentView === "home" 
              ? "text-on-surface bg-surface-container border border-outline-variant font-semibold" 
              : "text-text-muted hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="flex items-center gap-3">
            <Compass className="w-4 h-4" />
            <span>Home</span>
          </span>
        </button>

        <button 
          onClick={() => setView("ideas")}
          className={`flex items-center justify-between px-3.5 py-2.5 w-full rounded-md text-xs transition-all duration-150 cursor-pointer ${
            currentView === "ideas" 
              ? "text-on-surface bg-surface-container border border-outline-variant font-semibold" 
              : "text-text-muted hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="flex items-center gap-3">
            <Lightbulb className="w-4 h-4" />
            <span>Ideas</span>
          </span>
          {ideasCount > 0 && (
            <span className="text-[10px] font-mono text-text-muted bg-surface-container border border-outline-variant px-1.5 py-0.5 rounded">
              {ideasCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => setView("collections")}
          className={`flex items-center justify-between px-3.5 py-2.5 w-full rounded-md text-xs transition-all duration-150 cursor-pointer ${
            currentView === "collections" 
              ? "text-on-surface bg-surface-container border border-outline-variant font-semibold" 
              : "text-text-muted hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="flex items-center gap-3">
            <Layers className="w-4 h-4" />
            <span>Collections</span>
          </span>
        </button>

        <button 
          onClick={() => setView("pinned")}
          className={`flex items-center justify-between px-3.5 py-2.5 w-full rounded-md text-xs transition-all duration-150 cursor-pointer ${
            currentView === "pinned" 
              ? "text-on-surface bg-surface-container border border-outline-variant font-semibold" 
              : "text-text-muted hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="flex items-center gap-3">
            <Pin className="w-4 h-4" />
            <span>Pinned</span>
          </span>
          {pinnedCount > 0 && (
            <span className="text-[10px] font-mono text-text-muted bg-surface-container border border-outline-variant px-1.5 py-0.5 rounded">
              {pinnedCount}
            </span>
          )}
        </button>

        <div className="h-px bg-outline-variant my-5 mx-2"></div>
        
        <p className="text-[9px] font-mono text-text-muted px-2.5 py-1.5 uppercase tracking-wider">WORKSPACE SECTIONS</p>
        
        {collections.map(col => (
          <button
            key={col}
            onClick={() => setView(`collection-${col}`)}
            className={`flex items-center justify-between px-3.5 py-2 w-full rounded-md text-xs transition-all duration-150 cursor-pointer ${
              currentView === `collection-${col}`
                ? "text-on-surface bg-surface-container border border-outline-variant font-semibold"
                : "text-text-muted hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-outline" />
              <span className="truncate">{col}</span>
            </span>
          </button>
        ))}

        <div className="h-px bg-outline-variant my-5 mx-2"></div>

        <button 
          onClick={() => setView("archive")}
          className={`flex items-center justify-between px-3.5 py-2.5 w-full rounded-md text-xs transition-all duration-150 cursor-pointer ${
            currentView === "archive" 
              ? "text-on-surface bg-surface-container border border-outline-variant font-semibold" 
              : "text-text-muted hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="flex items-center gap-3">
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </span>
        </button>
      </nav>

      {/* Profile & Settings Footer */}
      <div className="mt-auto space-y-3.5 pt-5 border-t border-outline-variant">
        
        {/* Command Palette Button */}
        <button 
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-full px-3.5 py-2 rounded-md text-xs text-text-muted hover:text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
        >
          <span className="flex items-center gap-3">
            <Command className="w-4 h-4" />
            <span>Search Workspace</span>
          </span>
          <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant">⌘K</span>
        </button>

        {/* Theme Toggle */}
        <div className="bg-surface-container-low p-1 rounded-lg border border-outline-variant flex items-center justify-between relative overflow-hidden">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface border border-outline-variant rounded-md shadow-sm transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${theme === "dark" ? "left-1" : "left-1/2"}`}
          />
          <button 
            onClick={() => theme !== "dark" && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs transition-colors duration-300 z-10 cursor-pointer ${theme === "dark" ? "text-on-surface" : "text-text-muted hover:text-on-surface"}`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="font-semibold">Dark</span>
          </button>
          <button 
            onClick={() => theme !== "light" && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs transition-colors duration-300 z-10 cursor-pointer ${theme === "light" ? "text-on-surface" : "text-text-muted hover:text-on-surface"}`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="font-semibold">Light</span>
          </button>
        </div>

        {/* User Card */}
        <button 
          onClick={onProfileClick}
          className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl flex items-center gap-3 hover:bg-surface-container transition-all cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center border border-outline-variant flex-shrink-0">
            {userProfile.avatarUrl ? (
              <img 
                className="w-full h-full object-cover" 
                src={userProfile.avatarUrl} 
                alt={userProfile.name}
              />
            ) : (
              <span className="text-xs font-bold text-text-muted font-mono">
                {userProfile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold truncate text-on-surface">{userProfile.name || 'Set up profile'}</p>
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{userProfile.role || 'Click to configure'}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
