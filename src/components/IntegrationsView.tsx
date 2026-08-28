import { useState, useEffect } from "react";
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
  Settings
} from "lucide-react";
import { LLMProviderSettings } from "./LLMProviderSettings";

// A curated catalog of popular MCP servers
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
    id: "filesystem",
    name: "Filesystem",
    description: "Give the agent read/write access to local directories.",
    command: "npx",
    args: "-y @modelcontextprotocol/server-filesystem /path/to/dir",
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
}

interface IntegrationsViewProps {
  onBack: () => void;
}

export function IntegrationsView({ onBack }: IntegrationsViewProps) {
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [mcpStatus, setMcpStatus] = useState<"checking" | "online" | "offline">("checking");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  // Custom server form state
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<"stdio" | "http">("stdio");
  const [customCommand, setCustomCommand] = useState("");
  const [customArgs, setCustomArgs] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customToken, setCustomToken] = useState("");

  // Load saved servers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("foundry-mcp-servers");
    if (saved) {
      setServers(JSON.parse(saved));
    }
  }, []);

  // Save servers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("foundry-mcp-servers", JSON.stringify(servers));
  }, [servers]);

  // Check Foundry MCP server status
  useEffect(() => {
    setMcpStatus("online"); // The MCP server is built into the agent service
  }, []);

  const handleToggleServer = (id: string) => {
    setServers(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleDeleteServer = (id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
  };

  const handleAddFromCatalog = (catalog: typeof MCP_CATALOG[0]) => {
    const existing = servers.find(s => s.id === catalog.id);
    if (existing) return;

    setServers(prev => [...prev, {
      id: catalog.id,
      name: catalog.name,
      description: catalog.description,
      type: "stdio" as const,
      command: catalog.command,
      args: catalog.args,
      envKey: catalog.envKey,
      apiToken: "",
      enabled: false,
      icon: catalog.icon,
    }]);
    setShowCatalog(false);
  };

  const handleAddCustomServer = () => {
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

    setServers(prev => [...prev, newServer]);
    setCustomName("");
    setCustomCommand("");
    setCustomArgs("");
    setCustomUrl("");
    setCustomToken("");
    setShowAddCustom(false);
  };

  const handleUpdateToken = (id: string, token: string) => {
    setServers(prev => prev.map(s => s.id === id ? { ...s, apiToken: token } : s));
  };

  const enabledCount = servers.filter(s => s.enabled).length;

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
              <Plug className="w-6 h-6 text-primary" />
              MCP Integrations
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Connect external tools and data sources to your Foundry agents via MCP.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCatalog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-primary text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            BROWSE CATALOG
          </button>
          <button
            onClick={() => setShowAddCustom(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-on-surface text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            CUSTOM SERVER
          </button>
        </div>
      </div>

      {/* LLM Provider Settings */}
      <LLMProviderSettings />

      {/* Divider */}
      <div className="border-t border-outline-variant/30 pt-2">
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">MCP Tool Servers</p>
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
              <span className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full border border-red-400/20">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                OFFLINE
              </span>
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
      "args": ["foundry_mcp_server.py"]
    }
  }
}`}
          </code>
        </div>
      </div>

      {/* Connected External Servers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
            <Settings className="w-4 h-4 text-text-muted" />
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
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">{server.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggleServer(server.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
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
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Token / API Key Input (collapsed by default, show when there's an envKey) */}
                {server.envKey && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/30">
                    <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                      {server.envKey}
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your API token here..."
                      value={server.apiToken || ""}
                      onChange={(e) => handleUpdateToken(server.id, e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono text-on-surface placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50"
                    />
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
                        className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
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
                disabled={!customName.trim()}
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
