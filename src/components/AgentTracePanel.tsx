import { useState } from "react";
import { 
  Search, 
  Globe, 
  FileText, 
  Cpu, 
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Eye,
  Box,
  MessageSquare
} from "lucide-react";
import { AgentTraceEvent } from "../types";

interface AgentTracePanelProps {
  trace: AgentTraceEvent[];
  agentStatus?: 'idle' | 'running' | 'completed' | 'error';
  agentTokens?: {
    prompt: number;
    candidate: number;
    total: number;
  };
}

// Map tool names to icons and friendly labels
const TOOL_META: Record<string, { icon: typeof Search; label: string; color: string }> = {
  search_web: { icon: Search, label: "Web Search", color: "text-blue-400" },
  read_url_content: { icon: Globe, label: "Read URL", color: "text-cyan-400" },
  view_file: { icon: FileText, label: "View File", color: "text-amber-400" },
  foundry_list_items: { icon: Box, label: "List Items", color: "text-purple-400" },
  foundry_search_items: { icon: Search, label: "Search Items", color: "text-purple-400" },
  foundry_get_item: { icon: Eye, label: "Get Item", color: "text-purple-400" },
  foundry_workspace_summary: { icon: Cpu, label: "Workspace Summary", color: "text-purple-400" },
  foundry_create_item: { icon: Box, label: "Create Item", color: "text-green-400" },
  foundry_update_item: { icon: Box, label: "Update Item", color: "text-yellow-400" },
};

function getToolMeta(toolName?: string) {
  if (!toolName) return { icon: Cpu, label: "Unknown Tool", color: "text-text-muted" };
  return TOOL_META[toolName] || { icon: Cpu, label: toolName, color: "text-text-muted" };
}

function formatDuration(ms?: number): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTokens(count?: number): string {
  if (!count) return "0";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function TraceEventCard({ event, index }: { event: AgentTraceEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const meta = getToolMeta(event.toolName);
  const Icon = meta.icon;

  if (event.type === "tool_call") {
    return (
      <div className="relative group">
        {/* Timeline connector dot */}
        <div className={`absolute -left-[23px] top-3 w-2.5 h-2.5 rounded-full border-2 border-surface bg-surface-container-high ${meta.color.replace('text-', 'ring-')}/30 ring-2`} />

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant`}>
                <Icon className={`w-4 h-4 ${meta.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">
                    {meta.label}
                  </span>
                  <span className="text-[9px] font-mono text-text-muted bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant">
                    #{index + 1}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            {event.durationMs !== undefined && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted bg-surface-container px-2 py-1 rounded border border-outline-variant">
                <Clock className="w-3 h-3" />
                {formatDuration(event.durationMs)}
              </span>
            )}
          </div>

          {/* Tool Arguments */}
          {event.toolArgs && Object.keys(event.toolArgs).length > 0 && (
            <div className="mt-3 pt-3 border-t border-outline-variant/30">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted hover:text-on-surface transition-colors cursor-pointer"
              >
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span className="uppercase tracking-widest font-bold">Arguments</span>
              </button>
              {expanded && (
                <div className="mt-2 bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/30">
                  {Object.entries(event.toolArgs).map(([key, value]) => (
                    <div key={key} className="flex gap-2 mb-1 last:mb-0">
                      <span className="text-[10px] font-mono text-primary font-bold shrink-0">{key}:</span>
                      <span className="text-[10px] font-mono text-on-surface/80 break-all">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (event.type === "tool_result") {
    return (
      <div className="relative">
        {/* Timeline connector dot — smaller for results */}
        <div className="absolute -left-[21px] top-3 w-1.5 h-1.5 rounded-full bg-outline-variant" />

        <div className="ml-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-[10px] font-mono text-text-muted hover:text-on-surface transition-colors cursor-pointer group"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="uppercase tracking-widest font-bold">Result from {getToolMeta(event.toolName).label}</span>
            {event.durationMs !== undefined && (
              <span className="text-text-muted/60 font-normal">
                • {formatDuration(event.durationMs)}
              </span>
            )}
          </button>
          {expanded && (
            <div className="mt-2 bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/30 max-h-64 overflow-y-auto">
              <pre className="text-[10px] font-mono text-on-surface/70 whitespace-pre-wrap break-all leading-relaxed">
                {event.content}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (event.type === "final_response") {
    return (
      <div className="relative">
        <div className="absolute -left-[23px] top-3 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-500/20 border-2 border-surface" />
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="text-xs font-mono font-bold text-green-400 uppercase tracking-wider">Research Complete</p>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">
              {new Date(event.timestamp).toLocaleTimeString()} • Final report generated
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div className="relative">
        <div className="absolute -left-[23px] top-3 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20 border-2 border-surface" />
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">Agent Error</p>
            <p className="text-[10px] text-text-muted font-mono mt-1 break-all">{event.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (event.type === "thought") {
    return (
      <div className="relative">
        <div className="absolute -left-[21px] top-3 w-1.5 h-1.5 rounded-full bg-outline-variant" />
        <div className="ml-2 flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted italic leading-relaxed">{event.content}</p>
        </div>
      </div>
    );
  }

  return null;
}

export function AgentTracePanel({ trace, agentStatus, agentTokens }: AgentTracePanelProps) {
  // Calculate summary stats
  const toolCalls = trace.filter(e => e.type === "tool_call");
  const toolResults = trace.filter(e => e.type === "tool_result");
  const totalDurationMs = toolResults.reduce((acc, e) => acc + (e.durationMs || 0), 0);
  const uniqueTools = new Set(toolCalls.map(e => e.toolName)).size;

  // Group tool calls for the summary
  const toolUsageCounts: Record<string, number> = {};
  toolCalls.forEach(e => {
    const name = e.toolName || "unknown";
    toolUsageCounts[name] = (toolUsageCounts[name] || 0) + 1;
  });

  if (trace.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center mb-4">
          <Cpu className="w-8 h-8 text-text-muted opacity-30" />
        </div>
        <p className="text-sm font-medium text-text-muted">No agent trace available</p>
        <p className="text-xs text-text-muted/60 mt-1 max-w-xs">
          Run the Antigravity Agent on this item to see a full trace of its reasoning process, tool calls, and outputs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-mono font-bold text-on-surface uppercase tracking-widest">Agent Trace</h3>
          {agentStatus === "running" && (
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              LIVE
            </span>
          )}
          {agentStatus === "completed" && (
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
              <CheckCircle2 className="w-3 h-3" />
              DONE
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Tool Calls</p>
            <p className="text-lg font-bold text-on-surface mt-1">{toolCalls.length}</p>
          </div>
          <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Unique Tools</p>
            <p className="text-lg font-bold text-on-surface mt-1">{uniqueTools}</p>
          </div>
          <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Duration</p>
            <p className="text-lg font-bold text-on-surface mt-1">{formatDuration(totalDurationMs) || "—"}</p>
          </div>
          <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Tokens</p>
            <p className="text-lg font-bold text-on-surface mt-1">{formatTokens(agentTokens?.total)}</p>
          </div>
        </div>

        {/* Tool Usage Breakdown */}
        {Object.keys(toolUsageCounts).length > 0 && (
          <div className="mt-4 pt-4 border-t border-outline-variant/30">
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2 font-bold">Tool Usage</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(toolUsageCounts).map(([name, count]) => {
                const meta = getToolMeta(name);
                const ToolIcon = meta.icon;
                return (
                  <span
                    key={name}
                    className="flex items-center gap-1.5 text-[10px] font-mono bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant"
                  >
                    <ToolIcon className={`w-3 h-3 ${meta.color}`} />
                    <span className="text-on-surface font-semibold">{meta.label}</span>
                    <span className="text-text-muted">×{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-[7px] before:top-3 before:bottom-0 before:w-px before:bg-outline-variant/50">
        {trace.map((event, idx) => (
          <TraceEventCard key={event.id} event={event} index={idx} />
        ))}

        {/* Live indicator at the bottom when running */}
        {agentStatus === "running" && (
          <div className="relative">
            <div className="absolute -left-[23px] top-3 w-2.5 h-2.5 rounded-full bg-primary animate-pulse ring-2 ring-primary/20 border-2 border-surface" />
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <p className="text-xs font-mono text-primary animate-pulse">Agent is thinking...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
