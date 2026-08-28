import { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  Trash2,
  Check,
  GripVertical,
  BarChart3,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Shield,
  Activity,
} from "lucide-react";

interface LLMProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  maxRPM: number;
  maxRPD: number;
  capabilities: string[];
  priority: number;
  enabled: boolean;
  icon: string;
}

interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  maxRPM: number;
  maxRPD: number;
  capabilities: string[];
  icon: string;
}

interface UsageStats {
  [key: string]: {
    name: string;
    icon: string;
    rpm: number;
    rpd: number;
    totalRequests: number;
    totalTokens: number;
  };
}

export function LLMProviderSettings() {
  const [providers, setProviders] = useState<LLMProviderConfig[]>([]);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [usage, setUsage] = useState<UsageStats>({});
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editApiKey, setEditApiKey] = useState("");
  const [editModel, setEditModel] = useState("");
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [expandedUsage, setExpandedUsage] = useState(false);

  useEffect(() => {
    fetchProviders();
    fetchPresets();
    fetchUsage();

    // Refresh usage every 30s
    const interval = setInterval(fetchUsage, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function fetchProviders() {
    try {
      const res = await fetch("/api/llm/providers");
      if (res.ok) setProviders(await res.json());
    } catch { /* ignore */ }
  }

  async function fetchPresets() {
    try {
      const res = await fetch("/api/llm/presets");
      if (res.ok) setPresets(await res.json());
    } catch { /* ignore */ }
  }

  async function fetchUsage() {
    try {
      const res = await fetch("/api/llm/usage");
      if (res.ok) setUsage(await res.json());
    } catch { /* ignore */ }
  }

  async function addProvider(preset: ProviderPreset) {
    const newProvider: LLMProviderConfig = {
      ...preset,
      apiKey: "",
      enabled: true,
      priority: providers.length,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/llm/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProvider),
      });
      if (res.ok) {
        await fetchProviders();
        setShowAddPanel(false);
        setEditingId(newProvider.id);
        setEditApiKey("");
        setEditModel(preset.defaultModel);
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveProvider(provider: LLMProviderConfig) {
    setSaving(true);
    try {
      await fetch("/api/llm/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider),
      });
      await fetchProviders();
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProvider(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/llm/providers/${id}`, { method: "DELETE" });
      await fetchProviders();
    } finally {
      setSaving(false);
    }
  }

  async function toggleProvider(id: string) {
    const p = providers.find(pr => pr.id === id);
    if (!p) return;
    await saveProvider({ ...p, enabled: !p.enabled });
  }

  const configuredIds = new Set(providers.map(p => p.id));
  const availablePresets = presets.filter(p => !configuredIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">LLM Providers</h3>
            <p className="text-[10px] font-mono text-text-muted">
              Multi-provider routing with automatic fallback
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          ADD PROVIDER
        </button>
      </div>

      {/* Usage Summary Bar */}
      {Object.keys(usage).length > 0 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedUsage(!expandedUsage)}
            className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">Today's Usage</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                {Object.entries(usage).map(([id, u]) => (
                  <span key={id} className="text-[10px] font-mono text-text-muted">
                    {u.icon} {u.rpd}
                  </span>
                ))}
              </div>
              {expandedUsage ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
            </div>
          </button>

          {expandedUsage && (
            <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(usage).map(([id, u]) => (
                <div key={id} className="bg-surface-container rounded-lg p-3 border border-outline-variant/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-base">{u.icon}</span>
                    <span className="text-[10px] font-mono font-bold text-on-surface">{u.name}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-text-muted">
                      <span>Today</span>
                      <span className="text-on-surface font-bold">{u.rpd} req</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-text-muted">
                      <span>This Min</span>
                      <span className="text-on-surface font-bold">{u.rpm} RPM</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-text-muted">
                      <span>Tokens</span>
                      <span className="text-on-surface font-bold">{u.totalTokens.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Provider Panel */}
      {showAddPanel && (
        <div className="bg-surface-container-low border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">Select a Provider</p>
          {availablePresets.length === 0 ? (
            <p className="text-xs text-text-muted">All available providers have been added.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availablePresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => addProvider(preset)}
                  disabled={saving}
                  className="flex items-center gap-3 p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg cursor-pointer transition-colors text-left disabled:opacity-50"
                >
                  <span className="text-xl">{preset.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">{preset.name}</p>
                    <p className="text-[9px] font-mono text-text-muted">{preset.defaultModel}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provider List */}
      {providers.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
          <p className="text-sm text-text-muted">No providers configured</p>
          <p className="text-xs text-text-muted/60 mt-1">Add at least one LLM provider to enable AI features.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers
            .sort((a, b) => a.priority - b.priority)
            .map((provider, idx) => (
            <div
              key={provider.id}
              className={`bg-surface-container-low border rounded-xl overflow-hidden transition-colors ${
                provider.enabled
                  ? 'border-outline-variant hover:border-outline'
                  : 'border-outline-variant/30 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Drag Handle & Priority */}
                <div className="flex flex-col items-center gap-0.5 text-text-muted">
                  <GripVertical className="w-4 h-4 opacity-30" />
                  <span className="text-[8px] font-mono font-bold">{idx + 1}</span>
                </div>

                {/* Icon & Info */}
                <span className="text-xl">{provider.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-on-surface">{provider.name}</p>
                    {provider.enabled && provider.apiKey && (
                      <span className="text-[8px] font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20">ACTIVE</span>
                    )}
                    {provider.enabled && !provider.apiKey && (
                      <span className="text-[8px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">NO KEY</span>
                    )}
                    {!provider.enabled && (
                      <span className="text-[8px] font-mono text-text-muted bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant">DISABLED</span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-text-muted mt-0.5">{provider.defaultModel}</p>
                </div>

                {/* Rate Limit Info */}
                <div className="hidden md:flex gap-3 text-[9px] font-mono text-text-muted">
                  <span>{provider.maxRPM} RPM</span>
                  <span>{provider.maxRPD.toLocaleString()} RPD</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleProvider(provider.id)}
                    className={`w-8 h-5 rounded-full transition-colors cursor-pointer ${
                      provider.enabled ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform mx-0.5 ${
                      provider.enabled ? 'translate-x-3' : 'translate-x-0'
                    }`} />
                  </button>
                  <button
                    onClick={() => {
                      if (editingId === provider.id) {
                        setEditingId(null);
                      } else {
                        setEditingId(provider.id);
                        setEditApiKey("");
                        setEditModel(provider.defaultModel);
                      }
                    }}
                    className="p-1.5 hover:bg-surface-container rounded cursor-pointer transition-colors"
                    title="Configure"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                  {provider.id !== 'gemini' && (
                    <button
                      onClick={() => deleteProvider(provider.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Config Panel */}
              {editingId === provider.id && (
                <div className="px-4 pb-4 pt-2 border-t border-outline-variant/30 space-y-3">
                  <div>
                    <label className="text-[9px] font-mono text-text-muted uppercase tracking-widest font-bold mb-1 block">API Key</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showKeys.has(provider.id) ? "text" : "password"}
                          value={editApiKey}
                          onChange={e => setEditApiKey(e.target.value)}
                          placeholder={provider.apiKey || "Paste your API key..."}
                          className="w-full bg-surface-container text-xs px-3 py-2 rounded-lg outline-none border border-outline-variant focus:border-primary/50 font-mono pr-10"
                        />
                        <button
                          onClick={() => {
                            const next = new Set(showKeys);
                            if (next.has(provider.id)) next.delete(provider.id);
                            else next.add(provider.id);
                            setShowKeys(next);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                        >
                          {showKeys.has(provider.id) ? <EyeOff className="w-3.5 h-3.5 text-text-muted" /> : <Eye className="w-3.5 h-3.5 text-text-muted" />}
                        </button>
                      </div>
                    </div>
                    {provider.id === 'ollama' && (
                      <p className="text-[9px] text-text-muted mt-1">Ollama runs locally — no API key needed. Just enter any value (e.g. "local").</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-text-muted uppercase tracking-widest font-bold mb-1 block">Model</label>
                    <input
                      type="text"
                      value={editModel}
                      onChange={e => setEditModel(e.target.value)}
                      className="w-full bg-surface-container text-xs px-3 py-2 rounded-lg outline-none border border-outline-variant focus:border-primary/50 font-mono"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs font-mono text-text-muted hover:text-on-surface cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveProvider({
                        ...provider,
                        apiKey: editApiKey || provider.apiKey,
                        defaultModel: editModel || provider.defaultModel,
                      })}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded text-xs font-mono font-bold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" />
                      SAVE
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 text-[10px] font-mono text-text-muted leading-relaxed">
        <p className="font-bold text-on-surface/70 mb-1">How it works:</p>
        <p>Requests are routed to providers in priority order (top = highest). If a provider hits its rate limit or errors, the next one is tried automatically. All providers use OpenAI-compatible APIs — just paste the API key from each provider's free tier.</p>
        <p className="mt-2">
          <span className="font-bold text-primary">Free tier keys:</span>{' '}
          <a href="https://console.groq.com" className="underline hover:text-primary" target="_blank" rel="noreferrer">Groq</a> •{' '}
          <a href="https://console.mistral.ai" className="underline hover:text-primary" target="_blank" rel="noreferrer">Mistral</a> •{' '}
          <a href="https://cloud.cerebras.ai" className="underline hover:text-primary" target="_blank" rel="noreferrer">Cerebras</a> •{' '}
          <a href="https://openrouter.ai" className="underline hover:text-primary" target="_blank" rel="noreferrer">OpenRouter</a> •{' '}
          <a href="https://ollama.com" className="underline hover:text-primary" target="_blank" rel="noreferrer">Ollama</a>
        </p>
      </div>
    </div>
  );
}
