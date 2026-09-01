import { useEffect, useState } from "react";
import { X, Sparkles, Copy, Check, ArrowRight, ShieldAlert, Zap, Layers } from "lucide-react";
import { Markdown } from "./Markdown";
import { CopilotGeneration } from "../types";
import { SkeletonLoader } from "./SkeletonLoader";

interface CoPilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  action: "improve" | "audit" | "expand" | null;
  isLoading: boolean;
  content: string | null;
  error: string | null;
  providerInfo?: { provider?: string; model?: string; latencyMs?: number } | null;
  onApplyImprovement: (improvedText: string) => void;
  generations?: CopilotGeneration[];
  onSelectGeneration?: (gen: CopilotGeneration) => void;
}

export function CoPilotDrawer({
  isOpen,
  onClose,
  action,
  isLoading,
  content,
  error,
  providerInfo,
  onApplyImprovement,
  generations = [],
  onSelectGeneration
}: CoPilotDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Status logs for beautiful loading transition
  const statusSteps = {
    improve: [
      "Deconstructing prose into core propositional vectors...",
      "Refining vocabulary and technical syntax alignment...",
      "Polishing structural flow to elevate reading rhythm...",
      "Assembling optimized proposal drafts..."
    ],
    audit: [
      "Isolating product hypotheses and dependencies...",
      "Cross-referencing with common failure modes...",
      "Auditing distribution and operational friction barriers...",
      "Formulating strategic risk-mitigation vectors..."
    ],
    expand: [
      "Analyzing architectural scope parameters...",
      "Mapping feature modularity into decoupled components...",
      "Drafting developmental roadmaps and timeline phases...",
      "Assembling monetization models and complexity scoring..."
    ]
  };

  useEffect(() => {
    let interval: any;
    if (isLoading && action) {
      setLoadingStep(0);
      const steps = statusSteps[action] || ["Synthesizing thinking paradigms..."];
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % steps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading, action]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const currentSteps = action ? (statusSteps[action] || ["Synthesizing paradigms..."]) : ["Processing..."];
  const currentStepMessage = currentSteps[loadingStep];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Drawer Backdrop Blur */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#000000]/50 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Container Panel */}
      <div className="relative w-full max-w-xl bg-surface border-l border-outline-variant h-screen flex flex-col shadow-2xl z-10 transition-all duration-300 transform translate-x-0">
        
        {/* Drawer Header */}
        <div className="flex flex-col border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between px-6 py-4.5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-on-surface animate-pulse" />
              <h3 className="font-mono text-sm font-semibold tracking-wider text-on-surface uppercase">
                Foundry Co-Pilot {action ? `• ${action.toUpperCase()}` : ''}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-container text-text-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Version History Selector */}
          {generations.length > 0 && (
            <div className="px-6 pb-4 flex items-center gap-2">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">History:</span>
              <select 
                className="bg-surface-container text-xs text-on-surface px-2 py-1 rounded border border-outline-variant outline-none"
                onChange={(e) => {
                  const gen = generations.find(g => g.id === e.target.value);
                  if (gen && onSelectGeneration) onSelectGeneration(gen);
                }}
              >
                <option value="">-- View Past Generations --</option>
                {generations.map(gen => (
                  <option key={gen.id} value={gen.id}>
                    {new Date(gen.timestamp).toLocaleTimeString()} • {gen.action.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-7 space-y-6">
          {isLoading ? (
            /* Loading Sequence State */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4">
              <SkeletonLoader type="copilot" />
              <div className="max-w-xs space-y-2 mt-8">
                <p className="text-xs font-mono text-on-surface tracking-widest uppercase font-bold">CO-PILOT CONVENING</p>
                <p className="text-xs text-text-muted font-mono italic h-10 flex items-center justify-center leading-normal">
                  "{currentStepMessage}"
                </p>
              </div>
              <div className="flex gap-1.5">
                {currentSteps.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      loadingStep === idx ? "bg-primary w-4" : "bg-outline-variant"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : error ? (
            /* Error State */
            <div className="p-4.5 bg-red-950/10 border border-red-900/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-red-500">
                <ShieldAlert className="w-5 h-5" />
                <p className="text-xs font-bold font-mono uppercase tracking-wider">Analysis Failed</p>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {error}
              </p>
              <p className="text-[10px] text-text-muted font-mono">
                Make sure your API secret is declared. Tapping "Settings" can guide correct setups.
              </p>
            </div>
          ) : content ? (
            /* Analysis Completed State */
            <div className="prose max-w-none text-on-surface/95 leading-relaxed">
              <Markdown content={content} />
              {/* Provider Info Badge */}
              {providerInfo && (providerInfo.provider || providerInfo.model) && (
                <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-primary/60" />
                  <span className="text-[9px] font-mono text-text-muted">
                    {providerInfo.provider && <span className="text-primary/80 font-bold">{providerInfo.provider}</span>}
                    {providerInfo.model && <span> · {providerInfo.model}</span>}
                    {providerInfo.latencyMs && <span> · {(providerInfo.latencyMs / 1000).toFixed(1)}s</span>}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-muted/60 py-12">
              <Layers className="w-12 h-12 stroke-[1] opacity-50 mb-3" />
              <p className="text-xs">No analysis available. Click Improve, Audit or Expand inside the co-pilot menu below.</p>
            </div>
          )}
        </div>

        {/* Drawer Action Bar */}
        {content && !isLoading && !error && (
          <div className="px-6 py-4.5 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between gap-3 select-none">
            
            {/* Copy Recommendation */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-on-surface" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY</span>
                </>
              )}
            </button>

            {/* Custom Interactive Action: Apply Improvement directly to current text areas! */}
            {action === "improve" && (
              <button
                onClick={() => onApplyImprovement(content)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary hover:opacity-90 rounded-lg text-xs font-mono tracking-wider transition-all shadow-md group cursor-pointer font-bold"
              >
                <span>APPLY OPTIMIZATION</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {action === "expand" && (
              <button
                onClick={() => onApplyImprovement(content)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:opacity-90 rounded-lg text-xs font-mono tracking-wider transition-all shadow-md group cursor-pointer font-bold"
              >
                <span>APPLY EXPANSION</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            
            {action === "audit" && (
              <button
                onClick={() => onApplyImprovement(content)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:opacity-90 rounded-lg text-xs font-mono tracking-wider transition-all shadow-md group cursor-pointer font-bold"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>APPLY AUDIT</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
