import { useEffect, useState } from "react";
import { X, Sparkles, Copy, Check, ArrowRight, ShieldAlert, Zap, Layers } from "lucide-react";
import { Markdown } from "./Markdown";

interface CoPilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  action: "improve" | "audit" | "expand" | null;
  isLoading: boolean;
  content: string | null;
  error: string | null;
  onApplyImprovement: (improvedText: string) => void;
}

export function CoPilotDrawer({
  isOpen,
  onClose,
  action,
  isLoading,
  content,
  error,
  onApplyImprovement
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
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-on-surface animate-pulse" />
            <h3 className="font-mono text-sm font-semibold tracking-wider text-on-surface uppercase">
              Foundry Co-Pilot • {action?.toUpperCase()}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-container text-text-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-7 space-y-6">
          {isLoading ? (
            /* Loading Sequence State */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="absolute w-6 h-6 text-on-surface animate-pulse" />
              </div>
              <div className="max-w-xs space-y-2">
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
              <div className="text-[10px] font-mono text-text-muted tracking-wide uppercase font-semibold">
                Ready to weave into MVP scope
              </div>
            )}
            
            {action === "audit" && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted tracking-wide uppercase font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Validate vulnerabilities next</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
