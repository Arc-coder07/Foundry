import { useState, useEffect } from "react";
import { 
  Cloud, 
  CloudOff, 
  Search, 
  Plus, 
  Sparkles, 
  Command, 
  ChevronRight, 
  ArrowLeft, 
  Inbox,
  Filter,
  Zap,
  Menu
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { CommandPalette } from "./components/CommandPalette";
import { ShortcutCheatsheet } from "./components/ShortcutCheatsheet";
import { CoPilotDrawer } from "./components/CoPilotDrawer";
import { Editor } from "./components/Editor";
import { HomeView } from "./components/HomeView";
import { ProfileView } from "./components/ProfileView";
import ForgeTimeline from "./components/ForgeTimeline";
import { IntegrationsView } from "./components/IntegrationsView";
import EmptyState from "./components/EmptyState";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { useToast } from "./components/ToastContext";
import { PageTransition } from "./components/PageTransition";
import { AnimatePresence } from "motion/react";
import { WorkspaceItem, WorkspaceItemType, WorkspaceItemStatus, UserProfile, Milestone } from "./types";

export default function App() {
  const { addToast } = useToast();
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [currentView, setView] = useState<string>("home");
  
  // Modals & Drawers
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [coPilotOpen, setCoPilotOpen] = useState(false);
  const [coPilotAction, setCoPilotAction] = useState<"improve" | "audit" | "expand" | null>(null);
  const [coPilotLoading, setCoPilotLoading] = useState(false);
  const [coPilotContent, setCoPilotContent] = useState<string | null>(null);
  const [coPilotError, setCoPilotError] = useState<string | null>(null);
  const [coPilotProviderInfo, setCoPilotProviderInfo] = useState<{ provider?: string; model?: string; latencyMs?: number } | null>(null);
  
  // Theme setting
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("foundry-theme");
    return saved === "light" ? "light" : "dark";
  });
  
  // Synchronizing state indicator
  const [isSyncing, setIsSyncing] = useState(false);

  const totalSessionTokens = items.reduce((acc, item) => acc + (item.agentTokens?.total || 0), 0);

  const [apiError, setApiError] = useState<string | null>(null);

  // Search filter for lists
  const [listSearchQuery, setListSearchQuery] = useState("");

  // User Profile (persisted to localStorage)
  const defaultProfile: UserProfile = { name: "", role: "", bio: "", avatarUrl: "" };
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("foundry-profile");
      return saved ? JSON.parse(saved) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem("foundry-profile", JSON.stringify(profile));
  };

  // Milestone state
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Load items and milestones on mount
  useEffect(() => {
    fetchItems();
    fetchMilestones();
    
    // Apply persisted theme on mount
    const saved = localStorage.getItem("foundry-theme");
    document.documentElement.className = saved === "light" ? "light" : "dark";
  }, []);

  const fetchItems = async () => {
    setIsLoadingItems(true);
    try {
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        throw new Error("Failed to load database items");
      }
    } catch (err: any) {
      console.error(err);
      setApiError("Database connection failed. Operating in offline state.");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchMilestones = async () => {
    try {
      const res = await fetch("/api/milestones");
      if (res.ok) {
        const data = await res.json();
        setMilestones(data);
      }
    } catch (err) {
      console.error("Failed to load milestones:", err);
    }
  };

  // Find the active item
  const activeItem = items.find(item => item.id === activeItemId);

  // Polling for Agent Progress
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (activeItemId && activeItem?.agentStatus === 'running') {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/items/${activeItemId}`);
          if (res.ok) {
            const data: WorkspaceItem = await res.json();
            if (data.agentStatus !== activeItem.agentStatus || data.agentProgress !== activeItem.agentProgress) {
              setItems(prev => prev.map(item => item.id === data.id ? data : item));
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeItemId, activeItem?.agentStatus, activeItem?.agentProgress]);

  const handleCreateMilestone = async (milestone: Omit<Milestone, 'id'>) => {
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestone)
      });
      if (res.ok) {
        const created: Milestone = await res.json();
        setMilestones(prev => [...prev, created]);
      }
    } catch (err) {
      console.error("Failed to create milestone:", err);
    }
  };

  const handleUpdateMilestone = async (milestone: Milestone) => {
    setMilestones(prev => prev.map(m => m.id === milestone.id ? milestone : m));
    try {
      await fetch(`/api/milestones/${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestone)
      });
    } catch (err) {
      console.error("Failed to update milestone:", err);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    try {
      await fetch(`/api/milestones/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    }
  };

  // Keyboard Shortcuts Listening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      
      // ? to toggle cheatsheet (Shift + /)
      if (e.key === '?') {
        e.preventDefault();
        setCheatsheetOpen(prev => !prev);
      }
      
      // ⌘K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      // ⌘N or Ctrl+N for new idea
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleCreateItem("Idea");
      }
      // Esc to close palette
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items]);

  // Handle Light/Dark toggle
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.className = nextTheme;
    localStorage.setItem("foundry-theme", nextTheme);
  };

  // Create a new item
  const handleCreateItem = async (type: WorkspaceItemType, customInitial?: Partial<WorkspaceItem>) => {
    const defaultData: Partial<WorkspaceItem> = {
      title: customInitial?.title || `Untitled ${type}`,
      summary: customInitial?.summary || "",
      type,
      status: "Captured" as WorkspaceItemStatus,
      problem: customInitial?.problem || "",
      proposedSolution: customInitial?.proposedSolution || "",
      uniqueInsight: customInitial?.uniqueInsight || "",
      targetAudience: customInitial?.targetAudience || "",
      validationHypothesis: customInitial?.validationHypothesis || "",
      mvp: customInitial?.mvp || "",
      longTermVision: "",
      businessModel: customInitial?.businessModel || "",
      technicalChallenges: customInitial?.technicalChallenges || "",
      provenance: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase(),
      source: "BRAINSTORM",
      confidence: "65%",
      priority: "Medium",
      interestLevel: "8/10",
      difficulty: "Medium",
      tags: customInitial?.tags || ["RAW", "CONCEPT"],
      collection: customInitial?.collection || "AI",
      pinned: false,
      relatedIds: [],
      attachments: [],
      moodboard: [],
    };

    setIsSyncing(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultData)
      });
      if (res.ok) {
        const created: WorkspaceItem = await res.json();
        setItems(prev => [...prev, created]);
        setActiveItemId(created.id);
        setView("workspace");
      }
    } catch (err) {
      console.error("Failed to persist new entry:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Update/Sync an item (autosave with optimistic UI updates)
  const handleUpdateItem = async (updatedItem: WorkspaceItem) => {
    // Optimistic state update
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setIsSyncing(true);

    try {
      const res = await fetch(`/api/items/${updatedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem)
      });
      if (res.ok) {
        const saved: WorkspaceItem = await res.json();
        // Sync back with any server timestamps
        setItems(prev => prev.map(item => item.id === saved.id ? saved : item));
      }
    } catch (err) {
      console.error("Save sync failed:", err);
    } finally {
      // Small timeout for smooth feedback
      setTimeout(() => setIsSyncing(false), 300);
    }
  };

  // Delete an item
  const handleDeleteItem = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
        setActiveItemId(null);
        setView("ideas");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger Co-Pilot AI analysis
  const handleTriggerCoPilot = async (action: "improve" | "audit" | "expand") => {
    if (!activeItemId) return;
    setCoPilotAction(action);
    setCoPilotOpen(true);
    setCoPilotLoading(true);
    setCoPilotContent(null);
    setCoPilotError(null);
    setCoPilotProviderInfo(null);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: activeItemId, action })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCoPilotContent(data.content);
        if (data.provider || data.model) {
          setCoPilotProviderInfo({ provider: data.provider, model: data.model, latencyMs: data.latencyMs });
        }
        const activeItem = items.find(i => i.id === activeItemId);
        if (activeItem) {
          const newGeneration = {
            id: `gen-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: action,
            content: data.content
          };
          
          const updatedItem = {
            ...activeItem,
            copilotGenerations: [newGeneration, ...(activeItem.copilotGenerations || [])]
          };
          
          handleUpdateItem(updatedItem);
        }
      } else {
        throw new Error(data.error || "Co-pilot synthesis failed");
      }
    } catch (err: any) {
      console.error(err);
      setCoPilotError(err.message || "Communication failure with Gemini API.");
    } finally {
      setCoPilotLoading(false);
    }
  };

  // Trigger Antigravity Agent
  const handleTriggerAgent = async () => {
    if (!activeItemId) return;
    try {
      // MCP servers are now loaded server-side from data/mcp-servers.json
      const res = await fetch("/api/antigravity/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          itemId: activeItemId, 
          prompt: "Please research this idea and perform a SWOT analysis."
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start agent");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Communication failure with agent service.", "error");
    }
  };

  // Custom Co-pilot apply optimization trigger
  const handleApplyCoPilotImprovement = (improvedText: string) => {
    if (!activeItemId) return;
    const activeItem = items.find(i => i.id === activeItemId);
    if (!activeItem) return;

    let updatedItem = { ...activeItem };

    if (coPilotAction === "improve") {
      const problemMatch = improvedText.match(/### Refined Problem Statement\s*([\s\S]*?)(?=###|$)/i);
      const solutionMatch = improvedText.match(/### Optimized Proposed Solution\s*([\s\S]*?)(?=###|$)/i);
      const summaryMatch = improvedText.match(/### Improved Core Premise\s*([\s\S]*?)(?=###|$)/i);

      updatedItem = {
        ...updatedItem,
        problem: problemMatch ? problemMatch[1].trim() : activeItem.problem,
        proposedSolution: solutionMatch ? solutionMatch[1].trim() : activeItem.proposedSolution,
        summary: summaryMatch ? summaryMatch[1].trim().split("\n")[0] : activeItem.summary,
        status: "Expanded" as WorkspaceItemStatus
      };
    } else if (coPilotAction === "audit") {
      const vulnerabilitiesMatch = improvedText.match(/### 🔴 Critical Vulnerabilities & Blindspots\s*([\s\S]*?)(?=###|$)/i);
      const hardshipsMatch = improvedText.match(/### 🟡 Operational & Technical Hardships\s*([\s\S]*?)(?=###|$)/i);
      const mitigatingMatch = improvedText.match(/### 🟢 Mitigating Recommendations\s*([\s\S]*?)(?=###|$)/i);

      updatedItem = {
        ...updatedItem,
        validationHypothesis: vulnerabilitiesMatch ? vulnerabilitiesMatch[1].trim() : activeItem.validationHypothesis,
        technicalChallenges: hardshipsMatch ? hardshipsMatch[1].trim() : activeItem.technicalChallenges,
        status: "Planning" as WorkspaceItemStatus
      };
      
      if (mitigatingMatch) {
         updatedItem.decisions = [
           ...(updatedItem.decisions || []),
           {
             id: `dec-${Date.now()}`,
             status: "Pending",
             title: "Co-Pilot Mitigating Recommendations",
             content: mitigatingMatch[1].trim()
           }
         ];
      }
    } else if (coPilotAction === "expand") {
      const mvpMatch = improvedText.match(/### 🎯 Defined MVP boundaries & Feature Scope\s*([\s\S]*?)(?=###|$)/i);
      const businessMatch = improvedText.match(/### 💰 Monetization & Value Capture\s*([\s\S]*?)(?=###|$)/i);
      const roadmapMatch = improvedText.match(/### 🗓️ Phased Implementation Roadmap\s*([\s\S]*?)(?=###|$)/i);

      let mvpText = activeItem.mvp || "";
      if (mvpMatch) {
        const features = mvpMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
        const newMvpText = features.map(f => `[ ] ${f.replace(/^[-*]\s*/, '')}`).join('\n');
        mvpText = mvpText ? `${mvpText}\n${newMvpText}` : newMvpText;
      }

      updatedItem = {
        ...updatedItem,
        mvp: mvpText,
        businessModel: businessMatch ? businessMatch[1].trim() : activeItem.businessModel,
        status: "Planning" as WorkspaceItemStatus
      };

      if (roadmapMatch) {
         updatedItem.timeline = [
           {
             id: `time-${Date.now()}`,
             version: "AI Generated Roadmap",
             title: "Co-Pilot Expansion",
             date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase(),
             summary: roadmapMatch[1].trim()
           },
           ...(updatedItem.timeline || [])
         ];
      }
    }

    handleUpdateItem(updatedItem);
    setCoPilotOpen(false);
  };

  // Filter items for List View depending on activeView selection
  const getFilteredItemsForList = () => {
    let filtered = items;
    
    // Check main views
    if (currentView === "ideas") {
      filtered = items.filter(i => i.type === "Idea" && i.status !== "Archived");
    } else if (currentView === "pinned") {
      filtered = items.filter(i => i.pinned && i.status !== "Archived");
    } else if (currentView === "archive") {
      filtered = items.filter(i => i.status === "Archived");
    } else if (currentView.startsWith("collection-")) {
      const colName = currentView.replace("collection-", "");
      filtered = items.filter(i => i.collection?.toLowerCase() === colName.toLowerCase());
    }

    // Apply list search filter
    if (listSearchQuery.trim() !== "") {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(listSearchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const listItems = getFilteredItemsForList();

  return (
    <div className="flex h-screen overflow-hidden relative">
      
      {/* Noise Atmosphere overlay */}
      <div className="noise-overlay" />

      {/* Sidebar navigation */}
      <Sidebar
        currentView={currentView}
        setView={(v) => {
          setView(v);
          setActiveItemId(null);
        }}
        items={items}
        onCreateItem={(type) => handleCreateItem(type)}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        userProfile={userProfile}
        onProfileClick={() => {
          setActiveItemId(null);
          setView("profile");
        }}
      />

      {/* Main thought workspace */}
      <main className="flex-1 ml-0 md:ml-64 flex flex-col relative bg-background overflow-hidden transition-all duration-300">
        
        {/* Workspace Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 md:px-10 w-full z-10 border-b border-outline-variant/15">
          <div className="flex items-center gap-4">
            {activeItemId && (
              <button 
                onClick={() => {
                  setActiveItemId(null);
                  setView("home");
                }}
                className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all md:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <button onClick={() => { setActiveItemId(null); setView("home"); }} className="hover:text-primary transition-colors cursor-pointer">
                  / WORKSPACE
                </button>
                {activeItemId && activeItem ? (
                  <>
                    <button 
                      onClick={() => { setActiveItemId(null); setView(activeItem.type === "Idea" ? "ideas" : "home"); }} 
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      / {activeItem.type.toUpperCase()}
                    </button>
                    <span className="text-on-surface">/ {activeItem.title.length > 18 ? activeItem.title.slice(0, 18).toUpperCase() + '...' : activeItem.title.toUpperCase()}</span>
                  </>
                ) : (
                  <span className="text-on-surface">/ {currentView.toUpperCase()}</span>
                )}
              </span>
              {activeItemId && activeItem && (
                <span className="px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-primary font-mono text-[9px] uppercase tracking-wider">
                  {activeItem.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {totalSessionTokens > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-primary">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
                  {totalSessionTokens.toLocaleString()} Session Tokens
                </span>
              </div>
            )}
            
            {/* Sync Feedback status badge */}
            <div className="flex items-center gap-2 font-mono text-[10px] text-on-surface-variant/70">
              {isSyncing ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-primary" />
                  <span>Synced</span>
                </>
              )}
            </div>

            {/* Quick Commander palette trigger button */}
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="font-mono text-[10px] px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded border border-outline-variant/20 hover:text-primary transition-all text-on-surface-variant flex items-center gap-1.5"
            >
              <Search className="w-3 h-3" />
              <span>⌘K</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Core */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6">
          {apiError && (
            <div className="mb-6 p-3 bg-error-container/5 border border-error/20 rounded text-xs text-error/80 flex items-center gap-2">
              <CloudOff className="w-4 h-4" />
              <span>{apiError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeItemId && activeItem ? (
              /* ACTIVE ITEM EDITOR */
              <PageTransition viewKey="editor">
                <Editor
                  item={activeItem}
                  allItems={items}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onSwitchItem={(id) => setActiveItemId(id)}
                  isSyncing={isSyncing}
                  milestones={milestones}
                  onCreateMilestone={handleCreateMilestone}
                  onUpdateMilestone={handleUpdateMilestone}
                  onDeleteMilestone={handleDeleteMilestone}
                />
              </PageTransition>
             ) : currentView === "profile" ? (
              /* PROFILE VIEW */
              <PageTransition viewKey="profile">
                <ProfileView
                  profile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onBack={() => setView("home")}
                />
              </PageTransition>
             ) : currentView === "integrations" ? (
            /* INTEGRATIONS / MCP VIEW */
            <IntegrationsView
              onBack={() => setView("home")}
            />
            ) : currentView === "forge-timeline" ? (
              /* FORGE TIMELINE VIEW */
              <PageTransition viewKey="timeline">
                <ForgeTimeline
                  items={items}
                  milestones={milestones}
                  onSelectItem={(id) => {
                    setActiveItemId(id);
                    setView("editor");
                  }}
                  onCreateMilestone={handleCreateMilestone}
                  onUpdateMilestone={handleUpdateMilestone}
                  onDeleteMilestone={handleDeleteMilestone}
                  onBack={() => setView("home")}
                />
              </PageTransition>
            ) : currentView === "home" ? (
            /* LANDING STARTING SCREEN */
            <PageTransition viewKey="home">
              <HomeView
                items={items}
                onSelectItem={(id) => {
                  setActiveItemId(id);
                  setView("editor");
                }}
                onCreateItem={(type, customData) => { handleCreateItem(type, customData); }}
              />
            </PageTransition>
          ) : (
            /* DIRECTORY / OPPORTUNITY FILTER LIST VIEW */
            <PageTransition viewKey="directory">
              <div className="max-w-[1000px] mx-auto space-y-8 py-4">
              
              {/* Directory Header with Quick Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
                <div>
                  <h1 className="font-headline-md text-2xl font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    <span>{currentView.replace("collection-", "").toUpperCase()} POOL</span>
                  </h1>
                  <p className="text-xs text-on-surface-variant/70 mt-1 uppercase font-mono">
                    Structured product opportunities within this scope
                  </p>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                  <input
                    type="text"
                    value={listSearchQuery}
                    onChange={(e) => setListSearchQuery(e.target.value)}
                    placeholder="Search titles or tags..."
                    className="w-full bg-surface-container-low border border-outline-variant/25 rounded pl-9 pr-4 py-1.5 text-xs text-on-surface outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
                  />
                </div>
              </div>

              {/* Opportunities list */}
              {isLoadingItems ? (
                <div className="py-12">
                  <SkeletonLoader type="list" />
                </div>
              ) : listItems.length > 0 ? (
                <div className="space-y-3">
                  {listItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveItemId(item.id);
                        setView("editor");
                      }}
                      className="p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 hover:border-primary/40 rounded flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all duration-150 group"
                    >
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/10 text-primary font-mono text-[9px] uppercase tracking-wider">
                            {item.type}
                          </span>
                          <h3 className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors truncate max-w-md">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-xs text-on-surface-variant/75 line-clamp-1 leading-relaxed pl-1">
                          {item.summary || "No summary provided."}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant/60 flex-shrink-0">
                        <span className="px-2 py-0.5 rounded bg-surface-container font-semibold text-primary">
                          {item.confidence || "65%"} CONF
                        </span>
                        <span className="uppercase text-[10px] hidden sm:block">
                          {item.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty list State */
                <EmptyState 
                  type={currentView === "archive" ? "archive" : currentView === "ideas" ? "ideas" : "collections"}
                >
                  <button 
                    onClick={() => handleCreateItem("Idea")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-on-primary rounded text-[10px] font-label-caps tracking-wider transition-all shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>CREATE NEW IDEA</span>
                  </button>
                </EmptyState>
              )}

              </div>
            </PageTransition>
          )}
          </AnimatePresence>
        </div>

        {/* Floating AI Co-Pilot control deck (displayed when editing an item) */}
        {activeItemId && activeItem && (
          <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-fit px-5 py-2.5 glass rounded-full flex items-center gap-5 shadow-2xl border border-outline-variant z-30 select-none">
            <div className="flex items-center gap-2.5 pr-5 border-r border-outline-variant/35">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="font-label-caps text-[10px] text-on-surface uppercase tracking-widest">Co-Pilot Menu</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleTriggerCoPilot("improve")}
                className="px-3.5 py-1.5 hover:bg-surface-container rounded-full transition-all text-text-muted hover:text-primary font-label-caps text-[10px] flex items-center gap-2 cursor-pointer font-bold"
                title="Polish the prose, statements and summaries"
              >
                <span>IMPROVE</span>
              </button>
              
              <button 
                onClick={() => handleTriggerCoPilot("audit")}
                className="px-3.5 py-1.5 hover:bg-surface-container rounded-full transition-all text-text-muted hover:text-primary font-label-caps text-[10px] flex items-center gap-2 cursor-pointer font-bold"
                title="Identify assumptions, blindspots and architectural weaknesses"
              >
                <span>AUDIT</span>
              </button>
              
              <button 
                onClick={() => handleTriggerCoPilot("expand")}
                className="px-3.5 py-1.5 hover:bg-surface-container rounded-full transition-all text-text-muted hover:text-primary font-label-caps text-[10px] flex items-center gap-2 cursor-pointer font-bold"
                title="Suggest MVP limits, technical blocks, roadmaps, complexity scoring"
              >
                <span>EXPAND</span>
              </button>

              <button 
                onClick={handleTriggerAgent}
                className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full transition-all text-primary font-label-caps text-[10px] flex items-center gap-2 cursor-pointer font-bold border border-primary/20"
                title="Run an autonomous Antigravity agent to research and perform SWOT analysis"
              >
                <Zap className="w-3 h-3" />
                <span>AGENT</span>
              </button>
            </div>
            
            <div className="pl-3 flex items-center gap-4">
              {activeItem?.agentTokens && (
                <div className="hidden md:flex items-center gap-2 text-primary/80 font-mono text-[9px] uppercase tracking-widest bg-primary/5 px-2 py-1 rounded border border-primary/10">
                  <span className="text-on-surface/50">Run Cost:</span> 
                  <span className="font-bold">{activeItem.agentTokens.total.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/75 animate-ping" />
                <span className="font-mono text-[9px] text-text-muted uppercase">ACTIVE</span>
              </div>
            </div>
          </footer>
        )}

        {/* Agent Progress Banner */}
        {activeItemId && activeItem?.agentStatus === 'running' && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-fit px-6 py-3 bg-surface-container-high border border-primary/30 rounded-full flex items-center gap-4 shadow-xl z-30">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary animate-pulse" />
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-primary uppercase tracking-widest">Antigravity Agent Working</span>
                <span className="text-xs text-on-surface-variant font-mono">{activeItem.agentProgress || "Initializing..."}</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Slide-out AI Drawer */}
      <CoPilotDrawer
        isOpen={coPilotOpen}
        onClose={() => setCoPilotOpen(false)}
        action={coPilotAction}
        isLoading={coPilotLoading}
        content={coPilotContent}
        error={coPilotError}
        providerInfo={coPilotProviderInfo}
        generations={items.find(i => i.id === activeItemId)?.copilotGenerations || []}
        onSelectGeneration={(gen) => {
          setCoPilotAction(gen.action as any);
          setCoPilotContent(gen.content);
        }}
        onApplyImprovement={handleApplyCoPilotImprovement}
      />

      {/* Modals & Overlays */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
        items={items}
        onSelectItem={(id) => {
          setActiveItemId(id);
          setView("editor");
        }}
        onCreateItem={(type) => handleCreateItem(type)}
        toggleTheme={toggleTheme}
        theme={theme}
      />
      
      <ShortcutCheatsheet
        isOpen={cheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
      />

    </div>
  );
}
