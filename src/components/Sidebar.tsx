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
  Zap,
  BarChart3,
  Plug
} from "lucide-react";
import { WorkspaceItem, UserProfile } from "../types";
import { motion } from "motion/react";

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  currentView: string;
  onClick: () => void;
  badge?: React.ReactNode;
}

function NavItem({ id, label, icon, currentView, onClick, badge }: NavItemProps) {
  const isActive = currentView === id;
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center justify-between px-3.5 py-2.5 w-full rounded-md text-xs transition-all duration-150 cursor-pointer ${
        isActive
          ? "text-on-surface font-semibold" 
          : "text-text-muted hover:text-on-surface hover:bg-surface-container-low"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 bg-surface-container border border-outline-variant rounded-md"
          transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
        />
      )}
      <span className="flex items-center gap-3 relative z-10">
        {icon}
        <span>{label}</span>
      </span>
      {badge && <span className="relative z-10">{badge}</span>}
    </button>
  );
}

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
        
        <NavItem
          id="home"
          label="Home"
          icon={<Compass className="w-4 h-4" />}
          currentView={currentView}
          onClick={() => setView("home")}
        />

        <NavItem
          id="ideas"
          label="Ideas"
          icon={<Lightbulb className="w-4 h-4" />}
          currentView={currentView}
          onClick={() => setView("ideas")}
          badge={ideasCount > 0 ? (
            <span className="text-[10px] font-mono text-text-muted bg-surface-container border border-outline-variant px-1.5 py-0.5 rounded">
              {ideasCount}
            </span>
          ) : undefined}
        />

        <NavItem
          id="collections"
          label="Collections"
          icon={<Layers className="w-4 h-4" />}
          currentView={currentView}
          onClick={() => setView("collections")}
        />

        <NavItem
          id="pinned"
          label="Pinned"
          icon={<Pin className="w-4 h-4" />}
          currentView={currentView}
          onClick={() => setView("pinned")}
          badge={pinnedCount > 0 ? (
            <span className="text-[10px] font-mono text-text-muted bg-surface-container border border-outline-variant px-1.5 py-0.5 rounded">
              {pinnedCount}
            </span>
          ) : undefined}
        />

        <NavItem
          id="forge-timeline"
          label="Forge Timeline"
          icon={<BarChart3 className="w-4 h-4" />}
          currentView={currentView}
          onClick={() => setView("forge-timeline")}
        />

        <div className="h-px bg-outline-variant my-5 mx-2"></div>
        
        <p className="text-[9px] font-mono text-text-muted px-2.5 py-1.5 uppercase tracking-wider">WORKSPACE SECTIONS</p>
        
        {collections.map(col => (
          <NavItem
            key={col}
            id={`collection-${col}`}
            label={col}
            icon={<span className="w-1.5 h-1.5 rounded-full bg-outline ml-1.5" />}
            currentView={currentView}
            onClick={() => setView(`collection-${col}`)}
          />
        ))}

        <div className="h-px bg-outline-variant my-5 mx-2"></div>

        <p className="text-[9px] font-mono text-text-muted px-2.5 py-1.5 uppercase tracking-wider">SYSTEM</p>

        <NavItem
          id="integrations"
          label="Integrations"
          icon={<Plug className="w-4 h-4" />}
          currentView={currentView}
          onClick={() => setView("integrations")}
          badge={<span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="MCP Online" />}
        />

        <NavItem
          id="archive"
          label="Archive"
          icon={<Archive className="w-4 h-4" />}
          currentView={currentView}
          onClick={() => setView("archive")}
        />
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
