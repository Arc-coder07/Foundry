import React, { useState } from "react";
import { 
  Lightbulb, 
  ArrowRight, 
  Compass, 
  Sparkles, 
  Layers, 
  Plus, 
  Clock, 
  BookOpen, 
  Terminal,
  Activity,
  Heart
} from "lucide-react";
import { WorkspaceItem } from "../types";

interface HomeViewProps {
  items: WorkspaceItem[];
  onSelectItem: (id: string) => void;
  onCreateItem: (type: 'Idea' | 'Research' | 'PRD' | 'Architecture' | 'Experiment', customInitialData?: Partial<WorkspaceItem>) => void;
}

export function HomeView({
  items,
  onSelectItem,
  onCreateItem
}: HomeViewProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qTitle, setQTitle] = useState("");
  const [qSummary, setQSummary] = useState("");
  const [qProblem, setQProblem] = useState("");
  const [qInsight, setQInsight] = useState("");

  // Get recently modified items (max 4)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const handleQuickSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim()) return;

    const initialData: Partial<WorkspaceItem> = {
      title: qTitle.trim(),
      summary: qSummary.trim() || "A newly captured product hypothesis.",
      problem: qProblem.trim() || "Unspecified friction points waiting to be structured.",
      uniqueInsight: qInsight.trim() || "Early stage concept awaiting technical auditing.",
      collection: "AI",
      tags: ["RAW", "SEED"]
    };

    onCreateItem("Idea", initialData);
    
    // Reset state
    setQTitle("");
    setQSummary("");
    setQProblem("");
    setQInsight("");
    setShowQuickAdd(false);
  };

  // Pre-configured templates to start thinking immediately
  const templates = [
    {
      name: "AI Copresent Agent Mesh",
      type: "Idea" as const,
      category: "AI",
      data: {
        title: "Autonomous Agent Router for heterogeneous model coordination.",
        summary: "An API proxy dynamically routing agent tasks based on latency, model cost, and reasoning depth.",
        problem: "As developers orchestrate multiple fine-tuned models (Gemini, Claude, custom embeddings), coordinating consensus and routing queries introduces extreme latency and fragile multi-turn handoffs.",
        uniqueInsight: "A stateful router can predict correct routing paths by inspecting query semantics in under 12ms, reducing operational overhead by 40% and avoiding pro-tier invocation costs.",
        tags: ["ROUTER", "AGENT", "ORCHESTRATION"]
      }
    },
    {
      name: "Distributed Memory DB",
      type: "Architecture" as const,
      category: "Infrastructure",
      data: {
        title: "Key-Value State Cache utilizing persistent memory pooling.",
        summary: "A pure Rust LSM state manager with shared replication capabilities.",
        problem: "Standard database caches lose write states during transient connection dropouts, while traditional distributed locks halt transaction speeds.",
        uniqueInsight: "Merging write-ahead logs with decentralized clock vectors lets local nodes safely queue writes during split-brain scenarios.",
        tags: ["RUST", "DATABASE", "DISTRIBUTED"]
      }
    },
    {
      name: "Web3 Micro-Billing protocol",
      type: "Experiment" as const,
      category: "Fintech",
      data: {
        title: "Sub-cent latency billing logs for edge leases.",
        summary: "A cryptographic token billing channel optimized for nano-payment streaming.",
        problem: "Centralized credit cards charge 30c flat processing fees, making 0.01c API leases mathematically impossible to process.",
        uniqueInsight: "Stateless payment validation allows node-to-node ledger validation to occur asynchronously once per epoch rather than transactionally.",
        tags: ["BILLING", "LEDGER", "CRYPTOGRAPHY"]
      }
    }
  ];

  return (
    <div className="max-w-[900px] mx-auto py-16 px-4 space-y-20 md:space-y-24">
      
      {/* Centered Editorial Header */}
      <section className="text-center space-y-6 pt-6">
        <div className="flex justify-center mb-2">
          <span className="px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant text-text-muted font-mono text-[9px] tracking-widest uppercase">
            Product Thinking Operating System
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-[56px] text-on-surface leading-[1.1] tracking-tight font-medium max-w-2xl mx-auto">
          "I want to think <span className="italic font-serif opacity-50">here</span>."
        </h1>
        <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
          Foundry is the first place you visit whenever an idea is born. Overcome ambiguity, audit technical assumptions, and orchestrate buildable products.
        </p>
      </section>

      {/* Instant 60-Second Capture Console */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-8 md:p-10 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-on-surface animate-pulse" />
            <h3 className="font-label-caps text-xs text-on-surface uppercase tracking-widest">Quick Capture Idea</h3>
          </div>
          <button 
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="text-on-surface hover:opacity-85 text-xs font-mono tracking-wider underline underline-offset-4 font-semibold"
          >
            {showQuickAdd ? "HIDE INTERFACE" : "EXPAND CONSOLE (60s)"}
          </button>
        </div>

        {showQuickAdd ? (
          <form onSubmit={handleQuickSave} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-label-caps text-text-muted uppercase tracking-wider font-semibold">Idea Title</label>
              <input
                type="text"
                required
                value={qTitle}
                onChange={(e) => setQTitle(e.target.value)}
                placeholder="Autonomous edge router..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-label-caps text-text-muted uppercase tracking-wider font-semibold">One-Sentence Summary</label>
              <input
                type="text"
                value={qSummary}
                onChange={(e) => setQSummary(e.target.value)}
                placeholder="An API proxy routing task vectors dynamically..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-label-caps text-text-muted uppercase tracking-wider font-semibold">The Problem</label>
              <textarea
                value={qProblem}
                onChange={(e) => setQProblem(e.target.value)}
                rows={3}
                placeholder="Centralized systems introduce latency and fragile routing..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 resize-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-label-caps text-text-muted uppercase tracking-wider font-semibold">Unique Insight</label>
              <input
                type="text"
                value={qInsight}
                onChange={(e) => setQInsight(e.target.value)}
                placeholder="Routing paths can be predicted via semantics in under 12ms..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-3 bg-primary text-on-primary hover:opacity-90 rounded-lg text-xs font-mono font-bold tracking-wider transition-all shadow cursor-pointer"
              >
                <span>PERSIST THOUGHT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div 
            onClick={() => setShowQuickAdd(true)}
            className="border border-dashed border-outline-variant rounded-lg py-8 text-center hover:bg-surface-container transition-all cursor-pointer text-text-muted hover:text-on-surface text-xs font-mono tracking-wide"
          >
            + TAP TO LOG NEW IDEA IN UNDER 60 SECONDS
          </div>
        )}
      </section>

      {/* Continue Thinking (Recent Items List) */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 border-b border-outline-variant pb-3">
          <Clock className="w-4 h-4 text-on-surface opacity-60" />
          <h2 className="font-label-caps text-xs text-on-surface uppercase tracking-widest font-semibold">Continue Thinking</h2>
        </div>

        {recentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentItems.map(item => (
              <div 
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className="p-6 bg-surface-container-low border border-outline-variant hover:border-primary/30 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between h-[165px] group hover:-translate-y-0.5 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant text-on-surface font-mono text-[9px] uppercase tracking-wider font-medium">
                      {item.type}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {item.confidence || "50%"} CONF
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                    {item.summary || "No summary provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-outline-variant text-[10px] font-mono text-text-muted">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.pinned ? "bg-primary" : "bg-outline"}`} />
                    <span>{(item.status || "Captured").toUpperCase()}</span>
                  </div>
                  <span>{new Date(item.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 border border-dashed border-outline-variant rounded-xl text-center text-text-muted text-xs italic">
            Your think pool is currently empty. Capturing your first idea is just a click away.
          </div>
        )}
      </section>

      {/* Thought Starter Blueprints (Templates) */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 border-b border-outline-variant pb-3">
          <BookOpen className="w-4 h-4 text-on-surface opacity-60" />
          <h2 className="font-label-caps text-xs text-on-surface uppercase tracking-widest font-semibold">Thought Blueprints</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map(tpl => (
            <div 
              key={tpl.name}
              onClick={() => onCreateItem(tpl.type, tpl.data)}
              className="p-5 bg-surface-container-low border border-outline-variant hover:bg-surface-container hover:border-primary/30 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-[145px] group"
            >
              <div>
                <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1.5">{tpl.category}</p>
                <h5 className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                  {tpl.name}
                </h5>
                <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed mt-1">
                  {tpl.data.summary}
                </p>
              </div>
              <span className="text-[9px] font-mono text-text-muted uppercase group-hover:text-on-surface transition-colors mt-2.5 flex items-center gap-1.5 font-semibold">
                <span>Instantiate Blueprint</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
