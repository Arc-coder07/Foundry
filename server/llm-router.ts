/**
 * LLM Router — Multi-Provider Abstraction Layer
 * 
 * Routes AI requests across multiple free-tier LLM providers with
 * automatic fallback, rate limiting, and task-aware model selection.
 * 
 * Supported providers (all use OpenAI-compatible /v1/chat/completions):
 * - Google Gemini (via AI Studio free tier)
 * - Groq (free tier, ultra-fast)
 * - Mistral AI (free experiment tier)
 * - Cerebras (free tier)
 * - OpenRouter (free models aggregator)
 * - Ollama (local, unlimited)
 */

import { GoogleGenAI } from "@google/genai";

// ─── Types ────────────────────────────────────────────────────

export interface LLMProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  maxRPM: number;
  maxRPD: number;
  capabilities: ('chat' | 'json' | 'vision' | 'image_gen' | 'embeddings')[];
  priority: number;
  enabled: boolean;
  icon: string;
}

export interface LLMRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  task: 'copilot' | 'pivot' | 'research' | 'wireframe' | 'interview' | 'general';
  responseFormat?: 'text' | 'json';
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: { prompt: number; completion: number; total: number };
  latencyMs: number;
}

interface ProviderUsage {
  rpm: number;
  rpd: number;
  rpmResetAt: number;
  rpdResetAt: number;
  totalRequests: number;
  totalTokens: number;
}

// ─── Default Provider Presets ──────────────────────────────────

export const PROVIDER_PRESETS: Omit<LLMProviderConfig, 'apiKey' | 'enabled' | 'priority'>[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-2.5-flash-lite',
    maxRPM: 30,
    maxRPD: 1500,
    capabilities: ['chat', 'json', 'vision', 'image_gen'],
    icon: '✦',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai',
    defaultModel: 'llama-3.1-70b-versatile',
    maxRPM: 30,
    maxRPD: 1000,
    capabilities: ['chat', 'json'],
    icon: '⚡',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai',
    defaultModel: 'mistral-small-latest',
    maxRPM: 60,
    maxRPD: 10000,
    capabilities: ['chat', 'json'],
    icon: '🌊',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai',
    defaultModel: 'llama-3.1-70b',
    maxRPM: 30,
    maxRPD: 1000,
    capabilities: ['chat', 'json'],
    icon: '🧠',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'openrouter/auto',
    maxRPM: 20,
    maxRPD: 50,
    capabilities: ['chat', 'json', 'vision'],
    icon: '🔀',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434',
    defaultModel: 'mistral',
    maxRPM: 999,
    maxRPD: 99999,
    capabilities: ['chat', 'json'],
    icon: '🦙',
  },
];

// ─── LLM Router Class ─────────────────────────────────────────

export class LLMRouter {
  private providers: LLMProviderConfig[] = [];
  private usage: Map<string, ProviderUsage> = new Map();
  private geminiClient: GoogleGenAI | null = null;

  constructor() {
    // Initialize Gemini client from env if available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      this.geminiClient = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
  }

  /** Load provider configs (called on startup and when settings change) */
  loadProviders(configs: LLMProviderConfig[]): void {
    this.providers = configs
      .filter(p => p.enabled && p.apiKey)
      .sort((a, b) => a.priority - b.priority);

    // Initialize usage tracking for each provider
    for (const p of this.providers) {
      if (!this.usage.has(p.id)) {
        this.usage.set(p.id, {
          rpm: 0,
          rpd: 0,
          rpmResetAt: Date.now() + 60_000,
          rpdResetAt: Date.now() + 86_400_000,
          totalRequests: 0,
          totalTokens: 0,
        });
      }
    }

    console.log(`[LLM Router] Loaded ${this.providers.length} providers: ${this.providers.map(p => p.name).join(', ')}`);
  }

  /** Add the GEMINI_API_KEY from .env as a provider if not already configured */
  ensureGeminiFromEnv(): void {
    const envKey = process.env.GEMINI_API_KEY;
    if (!envKey) return;

    const existing = this.providers.find(p => p.id === 'gemini');
    if (existing) return;

    const preset = PROVIDER_PRESETS.find(p => p.id === 'gemini')!;
    const geminiProvider: LLMProviderConfig = {
      ...preset,
      apiKey: envKey,
      enabled: true,
      priority: 0,
    };
    this.providers.unshift(geminiProvider);
    this.usage.set('gemini', {
      rpm: 0, rpd: 0,
      rpmResetAt: Date.now() + 60_000,
      rpdResetAt: Date.now() + 86_400_000,
      totalRequests: 0, totalTokens: 0,
    });
    console.log(`[LLM Router] Auto-registered Gemini from GEMINI_API_KEY env var`);
  }

  /** Main entry point: route a request to the best available provider */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const eligible = this.getEligibleProviders(request);

    if (eligible.length === 0) {
      throw new Error(
        'No LLM providers available. Configure at least one provider with an API key in Settings > LLM Providers.'
      );
    }

    const errors: string[] = [];

    for (const provider of eligible) {
      try {
        const start = Date.now();
        let response: { content: string; usage?: any };

        // Gemini uses its own SDK for image_gen and special features
        if (provider.id === 'gemini' && this.geminiClient) {
          response = await this.callGemini(provider, request);
        } else if (provider.id === 'ollama') {
          response = await this.callOllama(provider, request);
        } else {
          response = await this.callOpenAICompatible(provider, request);
        }

        // Track usage
        this.trackUsage(provider.id, response.usage);

        return {
          content: response.content,
          provider: provider.id,
          model: provider.defaultModel,
          usage: response.usage,
          latencyMs: Date.now() - start,
        };
      } catch (err: any) {
        const msg = `${provider.name}: ${err.message || err}`;
        errors.push(msg);
        console.warn(`[LLM Router] ${msg}, trying next provider...`);
        continue;
      }
    }

    throw new Error(`All LLM providers failed.\n${errors.join('\n')}`);
  }

  /** Get usage stats for all providers */
  getUsageStats(): Record<string, ProviderUsage & { name: string; icon: string }> {
    const stats: Record<string, ProviderUsage & { name: string; icon: string }> = {};
    for (const p of this.providers) {
      const u = this.usage.get(p.id);
      if (u) {
        this.resetCountersIfNeeded(p.id);
        stats[p.id] = { ...this.usage.get(p.id)!, name: p.name, icon: p.icon };
      }
    }
    return stats;
  }

  /** Get the list of currently loaded providers */
  getProviders(): LLMProviderConfig[] {
    return this.providers;
  }

  /** Check if any provider is available */
  hasProviders(): boolean {
    return this.providers.length > 0;
  }

  // ─── Private: Provider Calls ──────────────────────────────

  private async callGemini(
    provider: LLMProviderConfig,
    request: LLMRequest
  ): Promise<{ content: string; usage?: any }> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    // Build prompt from messages
    const systemMsg = request.messages.find(m => m.role === 'system');
    const userMsgs = request.messages.filter(m => m.role !== 'system');
    const prompt = userMsgs.map(m => m.content).join('\n\n');

    const config: any = {
      temperature: request.temperature ?? 0.7,
    };
    if (systemMsg) config.systemInstruction = systemMsg.content;
    if (request.responseFormat === 'json') config.responseMimeType = 'application/json';

    const response = await this.geminiClient.models.generateContent({
      model: provider.defaultModel,
      contents: prompt,
      config,
    });

    const text = response.text || '';
    const usage = response.usageMetadata ? {
      prompt: response.usageMetadata.promptTokenCount || 0,
      completion: response.usageMetadata.candidatesTokenCount || 0,
      total: response.usageMetadata.totalTokenCount || 0,
    } : undefined;

    return { content: text, usage };
  }

  private async callOllama(
    provider: LLMProviderConfig,
    request: LLMRequest
  ): Promise<{ content: string; usage?: any }> {
    const body: any = {
      model: provider.defaultModel,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.7,
      },
    };

    if (request.responseFormat === 'json') {
      body.format = 'json';
    }

    const res = await fetch(`${provider.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    return {
      content: data.message?.content || '',
      usage: data.eval_count ? {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
        total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      } : undefined,
    };
  }

  private async callOpenAICompatible(
    provider: LLMProviderConfig,
    request: LLMRequest
  ): Promise<{ content: string; usage?: any }> {
    const body: any = {
      model: provider.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    };

    if (request.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Detect rate limiting
      if (res.status === 429) {
        throw new Error(`Rate limited (429)`);
      }
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      usage: data.usage ? {
        prompt: data.usage.prompt_tokens || 0,
        completion: data.usage.completion_tokens || 0,
        total: data.usage.total_tokens || 0,
      } : undefined,
    };
  }

  // ─── Private: Rate Limiting & Tracking ────────────────────

  private getEligibleProviders(request: LLMRequest): LLMProviderConfig[] {
    return this.providers
      .filter(p => {
        // If a specific provider is preferred, only use that one
        if (request.preferredProvider) return p.id === request.preferredProvider;
        return true;
      })
      .filter(p => this.isUnderRateLimit(p))
      .filter(p => this.supportsTask(p, request))
      .sort((a, b) => a.priority - b.priority);
  }

  private isUnderRateLimit(provider: LLMProviderConfig): boolean {
    this.resetCountersIfNeeded(provider.id);
    const u = this.usage.get(provider.id);
    if (!u) return true;
    return u.rpm < provider.maxRPM && u.rpd < provider.maxRPD;
  }

  private supportsTask(provider: LLMProviderConfig, request: LLMRequest): boolean {
    if (request.task === 'wireframe') return provider.capabilities.includes('image_gen');
    if (request.responseFormat === 'json') return provider.capabilities.includes('json');
    return provider.capabilities.includes('chat');
  }

  private trackUsage(providerId: string, usage?: any): void {
    const u = this.usage.get(providerId);
    if (!u) return;
    u.rpm++;
    u.rpd++;
    u.totalRequests++;
    if (usage?.total) u.totalTokens += usage.total;
  }

  private resetCountersIfNeeded(providerId: string): void {
    const u = this.usage.get(providerId);
    if (!u) return;
    const now = Date.now();
    if (now >= u.rpmResetAt) {
      u.rpm = 0;
      u.rpmResetAt = now + 60_000;
    }
    if (now >= u.rpdResetAt) {
      u.rpd = 0;
      u.rpdResetAt = now + 86_400_000;
    }
  }
}

// ─── Singleton Export ──────────────────────────────────────────

export const llmRouter = new LLMRouter();
