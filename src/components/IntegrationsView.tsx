import { useState, useEffect, useCallback } from "react";
import { 
  Plug, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft, 
  Globe, 
  Terminal, 
  Shield, 
  Zap,
  RefreshCw,
  ExternalLink,
  Settings,
  AlertTriangle,
  Play,
} from "lucide-react";
import { LLMProviderSettings } from "./LLMProviderSettings";

// Expanded curated catalog of popular MCP servers
const MCP_CATALOG = [
  {
    id: "github",
    name: "GitHub",
    description: "Read repos, issues, PRs, and code for competitor analysis.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-github",
    envKey: "GITHUB_PERSONAL_ACCESS_TOKEN",
    icon: "🐙",
    category: "Developer",
  },
  {
    id: "brave-search",
    name: "Brave Search",
    description: "Alternative web search with privacy-focused results.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-brave-search",
    envKey: "BRAVE_API_KEY",
    icon: "🦁",
    category: "Search",
  },
  {
    id: "tavily",
    name: "Tavily",
    description: "AI-optimized web search with structured results and citations.",
    command: "npx",
    args: "-y tavily-mcp@latest",
    envKey: "TAVILY_API_KEY",
    icon: "🔍",
    category: "Search",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Read team channels and search messages for context.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-slack",
    envKey: "SLACK_BOT_TOKEN",
    icon: "💬",
    category: "Communication",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Import pages and databases from your Notion workspace.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-notion",
    envKey: "NOTION_API_KEY",
    icon: "📝",
    category: "Productivity",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Create and manage issues, projects, and cycles in Linear.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-linear",
    envKey: "LINEAR_API_KEY",
    icon: "📐",
    category: "Project Management",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Search and read files from your Google Drive.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-gdrive",
    envKey: "GDRIVE_CREDENTIALS",
    icon: "📂",
    category: "Productivity",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Query and inspect PostgreSQL databases for data validation.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-postgres",
    envKey: "DATABASE_URL",
    icon: "🐘",
    category: "Database",
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Search and analyze error reports and issues from Sentry.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-sentry",
    envKey: "SENTRY_AUTH_TOKEN",
    icon: "🐛",
    category: "Developer",
  },
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Give the agent read/write access to local directories.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-filesystem /path/to/allowed/dir",
    envKey: "",
    icon: "📁",
    category: "System",
  },
];

interface McpServerConfig {
  id: string;
  name: string;
  description: string;
  type: "stdio" | "http";
  command?: string;
  args?: string;
  url?: string;
  envKey?: string;
  apiToken?: string;
  enabled: boolean;
  isBuiltin?: boolean;
  icon?: string;
  category?: string;
}

interface IntegrationsViewProps {
  onBack: () => void;
}

export function IntegrationsView({ onBack }: IntegrationsViewProps) {
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [mcpStatus, setMcpStatus] = useState<"checking" | "online" | "offline">("checking");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Custom server form state
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<"stdio" | "http">("stdio");
  const [customCommand, setCustomCommand] = useState("");
  const [customArgs, setCustomArgs] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customToken, setCustomToken] = useState("");

  // Editing state for inline token entry
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [editTokenValue, setEditTokenValue] = useState("");

  // Load servers from backend on mount
  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch("/api/mcp/servers");
      if (res.ok) setServers(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Real health check — pings the Python agent service
  useEffect(() => {
    setMcpStatus("checking");
    fetch("/api/mcp/status")
      .then(res => res.json())
      .then(data => setMcpStatus(data.status === "online" ? "online" : "offline"))
      .catch(() => setMcpStatus("offline"));
  }, []);

  const refreshStatus = () => {
    setMcpStatus("checking");
    fetch("/api/mcp/status")
      .then(res => res.json())
      .then(data => setMcpStatus(data.status === "online" ? "online" : "offline"))
      .catch(() => setMcpStatus("offline"));
  };

  // ─── Server CRUD via Backend ─────────────────────────────

  const handleToggleServer = async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) return;
    
    setSaving(true);
    try {
      await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...server, enabled: !server.enabled }),
      });
      await fetchServers();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteServer = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/mcp/servers/${id}`, { method: "DELETE" });
      await fetchServers();
    } finally {
      setSaving(false);
    }
  };

  const handleAddFromCatalog = async (catalog: typeof MCP_CATALOG[0]) => {
    const existing = servers.find(s => s.id === catalog.id);
    if (existing) return;

    setSaving(true);
    try {
      await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: catalog.id,
          name: catalog.name,
          description: catalog.description,
          type: "stdio",
          command: catalog.command,
          args: catalog.args,
          envKey: catalog.envKey,
          apiToken: "",
          enabled: false,
          icon: catalog.icon,
          category: catalog.category,
        }),
      });
      await fetchServers();
      setShowCatalog(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomServer = async () => {
    if (!customName.trim()) return;

    const newServer: McpServerConfig = {
      id: `custom-${Date.now()}`,
      name: customName,
      description: "Custom MCP server",
      type: customType,
      command: customType === "stdio" ? customCommand : undefined,
      args: customType === "stdio" ? customArgs : undefined,
      url: customType === "http" ? customUrl : undefined,
      apiToken: customToken || undefined,
      enabled: false,
      icon: "🔧",
    };

    setSaving(true);
    try {
      await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newServer),
      });
      await fetchServers();
      setCustomName("");
      setCustomCommand("");
      setCustomArgs("");
      setCustomUrl("");
      setCustomToken("");
      setShowAddCustom(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToken = async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) return;

    setSaving(true);
    try {
      await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...server, apiToken: editTokenValue }),
      });
      await fetchServers();
      setEditingTokenId(null);
      setEditTokenValue("");
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = servers.filter(s => s.enabled).length;

  // Helper: does this server need a token but doesn't have one?
  const isMissingToken = (server: McpServerConfig): boolean => {
    return !!(server.envKey && (!server.apiToken || server.apiToken === ''));
  };

  return (
    <div className="max-w-[900px] mx-auto space-y-8 py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              Settings & Integrations
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Configure AI providers, MCP tools, and external services.
            </p>
          </div>
        </div>
      </div>

      {/* LLM Provider Settings */}
      <LLMProviderSettings />

      {/* MCP Section Divider */}
      <div className="border-t border-outline-variant/30 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">MCP Tool Servers</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCatalog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-primary text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              CATALOG
            </button>
            <button
              onClick={() => setShowAddCustom(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-on-surface text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              CUSTOM
            </button>
          </div>
        </div>
      </div>

      {/* Foundry Built-in MCP Server Card */}
      <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl border border-primary/30">
              ⚡
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-on-surface">Foundry MCP Server</h3>
                <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20 font-bold">
                  BUILT-IN
                </span>
              </div>
              <p className="text-sm text-on-surface/70 mt-1">
                Exposes your workspace items, milestones, attachments, and search to any MCP-compatible AI client.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-[10px] font-mono text-text-muted bg-surface-container px-2 py-1 rounded border border-outline-variant">
                  10 tools &middot; 2 resources
                </span>
                <span className="text-[10px] font-mono text-text-muted bg-surface-container px-2 py-1 rounded border border-outline-variant">
                  stdio transport
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mcpStatus === "online" ? (
              <span className="flex items-center gap-2 text-xs font-mono text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                ACTIVE
              </span>
            ) : mcpStatus === "checking" ? (
              <span className="flex items-center gap-2 text-xs font-mono text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                <RefreshCw className="w-3 h-3 animate-spin" />
                CHECKING
              </span>
            ) : (
              <button
                onClick={refreshStatus}
                className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full border border-red-400/20 cursor-pointer hover:bg-red-400/20 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-red-400" />
                OFFLINE — Click to retry
              </button>
            )}
          </div>
        </div>
        
        {/* Connection snippet */}
        <div className="mt-4 bg-surface-container-lowest rounded-lg p-4 border border-outline-variant/30">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Claude Desktop / Cursor Config
          </p>
          <code className="text-xs text-on-surface/80 font-mono block whitespace-pre leading-relaxed">
{`{
  "mcpServers": {
    "foundry": {
      "command": "python3",
      "args": ["agent-service/foundry_mcp_server.py"]
    }
  }
}`}
          </code>
          <p className="text-[9px] text-text-muted mt-2">
            💡 Use an absolute path if running from outside the project root, e.g. <code className="text-primary/80">/full/path/to/Foundry/agent-service/foundry_mcp_server.py</code>
          </p>
        </div>
      </div>

      {/* Connected External Servers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
            <Plug className="w-4 h-4 text-text-muted" />
            External Integrations
            {enabledCount > 0 && (
              <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {enabledCount} active
              </span>
            )}
          </h2>
        </div>

        {servers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
            <Plug className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
            <p className="text-sm text-text-muted">No external MCP servers configured yet.</p>
            <p className="text-xs text-text-muted/60 mt-1">
              Browse the catalog or add a custom server to extend your agent's capabilities.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map(server => (
              <div
                key={server.id}
                className={`rounded-xl border p-5 transition-all duration-200 ${
                  server.enabled 
                    ? "border-primary/30 bg-primary/5" 
                    : "border-outline-variant bg-surface-container-low"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-xl border border-outline-variant">
                      {server.icon || "🔧"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        {server.name}
                        <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant">
                          {server.type}
                        </span>
                        {/* Warning badge: enabled but missing token */}
                        {server.enabled && isMissingToken(server) && (
                          <span className="flex items-center gap-1 text-[8px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            MISSING KEY
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">{server.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggleServer(server.id)}
                      disabled={saving}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-50 ${
                        server.enabled ? "bg-primary" : "bg-surface-container-high border border-outline-variant"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                          server.enabled ? "translate-x-[22px]" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server.id)}
                      disabled={saving}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Token / API Key Input */}
                {server.envKey && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/30">
                    <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                      {server.envKey}
                    </label>
                    {editingTokenId === server.id ? (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Paste your API token here..."
                          value={editTokenValue}
                          onChange={(e) => setEditTokenValue(e.target.value)}
                          className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono text-on-surface placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveToken(server.id)}
                          disabled={saving || !editTokenValue.trim()}
                          className="px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors disabled:opacity-30"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingTokenId(null); setEditTokenValue(""); }}
                          className="px-3 py-2 hover:bg-surface-container-high rounded-lg text-text-muted text-xs font-mono cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono text-text-muted">
                          {server.apiToken ? `${server.apiToken}` : "No token configured"}
                        </div>
                        <button
                          onClick={() => { setEditingTokenId(server.id); setEditTokenValue(""); }}
                          className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-mono font-bold text-on-surface cursor-pointer transition-colors"
                        >
                          {server.apiToken ? "UPDATE" : "ADD KEY"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Modal */}
      {showCatalog && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowCatalog(false)}>
          <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  MCP Server Catalog
                </h3>
                <p className="text-xs text-text-muted mt-1">Popular MCP servers you can add with one click.</p>
              </div>
              <button onClick={() => setShowCatalog(false)} className="p-2 rounded-lg hover:bg-surface-container-high text-text-muted hover:text-on-surface transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {MCP_CATALOG.map(entry => {
                const alreadyAdded = servers.some(s => s.id === entry.id);
                return (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-xl border border-outline-variant">
                        {entry.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">{entry.name}</h4>
                        <p className="text-xs text-text-muted mt-0.5">{entry.description}</p>
                        <span className="text-[9px] font-mono text-text-muted/60 uppercase tracking-widest">{entry.category}</span>
                      </div>
                    </div>
                    {alreadyAdded ? (
                      <span className="flex items-center gap-1.5 text-xs font-mono text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
                        <Check className="w-3.5 h-3.5" />
                        ADDED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddFromCatalog(entry)}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        ADD
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Server Modal */}
      {showAddCustom && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowAddCustom(false)}>
          <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                Add Custom MCP Server
              </h3>
              <button onClick={() => setShowAddCustom(false)} className="p-2 rounded-lg hover:bg-surface-container-high text-text-muted hover:text-on-surface transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Server Name */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Server Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Database Server"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Transport Type Toggle */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Transport Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCustomType("stdio")}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      customType === "stdio" 
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-surface-container border border-outline-variant text-text-muted hover:text-on-surface"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
                    STDIO
                  </button>
                  <button
                    onClick={() => setCustomType("http")}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      customType === "http"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-surface-container border border-outline-variant text-text-muted hover:text-on-surface"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 inline mr-1.5" />
                    HTTP
                  </button>
                </div>
              </div>

              {/* Stdio fields */}
              {customType === "stdio" && (
                <>
                  <div>
                    <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Command</label>
                    <input
                      type="text"
                      placeholder="e.g. npx, python3, node"
                      value={customCommand}
                      onChange={e => setCustomCommand(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Arguments</label>
                    <input
                      type="text"
                      placeholder="e.g. -y @modelcontextprotocol/server-github"
                      value={customArgs}
                      onChange={e => setCustomArgs(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </>
              )}

              {/* HTTP fields */}
              {customType === "http" && (
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Server URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/mcp"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50"
                  />
                </div>
              )}

              {/* API Token (optional) */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">API Token (Optional)</label>
                <input
                  type="password"
                  placeholder="Bearer token or API key"
                  value={customToken}
                  onChange={e => setCustomToken(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-mono text-on-surface placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50"
                />
              </div>

              <button
                onClick={handleAddCustomServer}
                disabled={!customName.trim() || saving}
                className="w-full py-3 bg-primary hover:opacity-90 text-on-primary rounded-lg text-xs font-mono font-bold tracking-wider transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ADD SERVER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
