# Free LLM Provider System — Multi-Model Abstraction Layer

## The Problem

Foundry is packed with AI-powered features (Co-Pilot, Agent Research, AI Pivot, Wireframes, future Synthetic Interviews, etc.), but every single one currently runs through a single paid Gemini API key. If the user doesn't have a Gemini key, or runs out of quota, the entire AI layer goes dark.

We need a system that:
1. **Works without paying** — leverages free-tier APIs from multiple providers
2. **Distributes load** — spreads requests across providers to stay under each one's rate limits
3. **Fails gracefully** — if one provider is down or rate-limited, automatically falls back to the next
4. **Is task-aware** — routes different types of work to the best-fit provider

---

## Architecture: The LLM Router

```
┌─────────────────────────────────────────────────────┐
│                   Foundry Backend                    │
│                                                     │
│  Co-Pilot ──┐                                       │
│  AI Pivot ──┤                                       │
│  Agent ─────┤──▶  LLM Router (llm-router.ts)       │
│  Wireframe ─┤         │                             │
│  Interviews ┘         ▼                             │
│              ┌────────────────────┐                  │
│              │  Provider Registry │                  │
│              │                    │                  │
│              │  ┌──────────────┐  │                  │
│              │  │ Gemini (paid)│  │  ◀── Primary     │
│              │  └──────────────┘  │                  │
│              │  ┌──────────────┐  │                  │
│              │  │ Groq (free)  │  │  ◀── Speed       │
│              │  └──────────────┘  │                  │
│              │  ┌──────────────┐  │                  │
│              │  │ Mistral(free)│  │  ◀── Volume      │
│              │  └──────────────┘  │                  │
│              │  ┌──────────────┐  │                  │
│              │  │ Cerebras     │  │  ◀── Throughput  │
│              │  └──────────────┘  │                  │
│              │  ┌──────────────┐  │                  │
│              │  │ OpenRouter   │  │  ◀── Aggregator  │
│              │  └──────────────┘  │                  │
│              │  ┌──────────────┐  │                  │
│              │  │ HuggingFace  │  │  ◀── Specialized │
│              │  └──────────────┘  │                  │
│              │  ┌──────────────┐  │                  │
│              │  │ Ollama(local)│  │  ◀── Offline     │
│              │  └──────────────┘  │                  │
│              └────────────────────┘                  │
└─────────────────────────────────────────────────────┘
```

---

## Free Provider Matrix

| Provider | Free Tier Limits | Best For | API Style | Key Required |
|---|---|---|---|---|
| **Google AI Studio** | ~1,500 RPD (Flash) | Large context, structured output | OpenAI-compatible | Yes (free) |
| **Groq** | ~30 RPM, 1000+ RPD | Ultra-fast responses, real-time chat | OpenAI-compatible | Yes (free) |
| **Mistral AI** | ~1B tokens/month (Experiment) | High-volume batch work | OpenAI-compatible | Yes (free) |
| **Cerebras** | ~1M tokens/day | High throughput batch processing | OpenAI-compatible | Yes (free) |
| **OpenRouter** | 50 RPD (free), 1000 RPD ($10 lifetime) | Model variety, fallback aggregator | OpenAI-compatible | Yes (free) |
| **HuggingFace** | ~300 req/hour (small models) | Specialized tasks (summarization, NER) | Custom REST | Yes (free) |
| **Ollama** | Unlimited (local hardware) | Offline, privacy-sensitive, no limits | OpenAI-compatible | No |

> **Key Insight:** Almost all modern free LLM APIs now support the **OpenAI-compatible** chat completions format (`/v1/chat/completions`). This means we can build a single adapter that talks to ALL of them using the same request/response shape.

---

## Implementation Plan

### File: `server/llm-router.ts`

This is the core abstraction. Every AI feature in Foundry will call `llmRouter.chat()` instead of directly calling the Gemini SDK.

```typescript
// Types
interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
  maxRPM: number;
  maxRPD: number;
  capabilities: ('chat' | 'json' | 'vision' | 'image_gen' | 'embeddings')[];
  priority: number;        // Lower = preferred
  currentUsage: { rpm: number; rpd: number; lastReset: number };
}

interface LLMRequest {
  messages: { role: string; content: string }[];
  task: 'copilot' | 'pivot' | 'research' | 'wireframe' | 'interview' | 'general';
  responseFormat?: 'text' | 'json';
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: string;  // Override: force a specific provider
}

interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: { prompt: number; completion: number; total: number };
  latencyMs: number;
}
```

### Core Logic: Smart Routing

```typescript
class LLMRouter {
  private providers: LLMProvider[] = [];

  async chat(request: LLMRequest): Promise<LLMResponse> {
    // 1. Get eligible providers (have capacity, support the task)
    const eligible = this.getEligibleProviders(request);
    
    // 2. Try each provider in priority order
    for (const provider of eligible) {
      try {
        const start = Date.now();
        const response = await this.callProvider(provider, request);
        
        // Track usage
        provider.currentUsage.rpm++;
        provider.currentUsage.rpd++;
        
        return {
          content: response.content,
          provider: provider.id,
          model: provider.defaultModel,
          usage: response.usage,
          latencyMs: Date.now() - start
        };
      } catch (err) {
        console.warn(`Provider ${provider.id} failed, trying next...`, err);
        continue; // Fallback to next provider
      }
    }
    
    throw new Error("All LLM providers exhausted or rate-limited.");
  }

  private getEligibleProviders(request: LLMRequest): LLMProvider[] {
    return this.providers
      .filter(p => p.apiKey)                                    // Has a key configured
      .filter(p => p.currentUsage.rpm < p.maxRPM)              // Under RPM limit
      .filter(p => p.currentUsage.rpd < p.maxRPD)              // Under RPD limit  
      .filter(p => this.supportsTask(p, request.task))         // Can do this task
      .sort((a, b) => a.priority - b.priority);                // Prefer higher priority
  }

  private supportsTask(provider: LLMProvider, task: string): boolean {
    // Task-specific routing
    if (task === 'wireframe') return provider.capabilities.includes('image_gen');
    if (task === 'pivot' || task === 'copilot') return provider.capabilities.includes('json');
    return provider.capabilities.includes('chat');
  }

  private async callProvider(provider: LLMProvider, request: LLMRequest): Promise<any> {
    // All providers use OpenAI-compatible format!
    const body: any = {
      model: provider.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    };
    
    if (request.responseFormat === 'json') {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`${provider.id}: ${res.status} ${await res.text()}`);
    
    const data = await res.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }
}
```

### Task-to-Provider Routing Strategy

Different Foundry features have different requirements. The router automatically picks the best provider:

| Foundry Feature | Requirement | Best Free Provider | Fallback |
|---|---|---|---|
| **Co-Pilot** (Improve/Audit/Expand) | Fast, good prose | Groq | Mistral → Gemini |
| **AI Pivot** (Version Control) | JSON output | Gemini (free tier) | Mistral → Groq |
| **Agent Research** | Tool calling, long context | Gemini | Groq → Mistral |
| **Wireframe Generation** | Image generation | Gemini (only) | — |
| **Synthetic Interviews** | Multi-turn chat, persona | Groq (speed) | Cerebras → Mistral |
| **Unit Economics** | Structured JSON output | Mistral | Groq → Gemini |
| **GTM Playbook** | Long-form generation | Mistral (volume) | Cerebras → Gemini |

---

## Configuration UI

### Settings Page Integration

Add a new section to the existing Settings/Integrations view:

```
┌─────────────────────────────────────────────┐
│  🧠 LLM PROVIDERS                           │
├─────────────────────────────────────────────┤
│                                               │
│  ✅ Google Gemini          [●●●●●○○○○○] 523/1500 RPD │
│     API Key: ••••••••sk-xxxx   [Edit]        │
│     Model: gemini-2.5-flash-lite             │
│                                               │
│  ✅ Groq                   [●●○○○○○○○○] 201/1000 RPD │
│     API Key: ••••••••gsk-xxxx  [Edit]        │
│     Model: llama-3.1-70b-versatile           │
│                                               │
│  ⬚ Mistral AI              Not configured    │
│     API Key: [________________] [Save]       │
│     Model: mistral-small-latest              │
│                                               │
│  ⬚ Cerebras                Not configured    │
│     API Key: [________________] [Save]       │
│                                               │
│  ⬚ OpenRouter              Not configured    │
│     API Key: [________________] [Save]       │
│                                               │
│  ✅ Ollama (Local)         [Always Available] │
│     URL: http://localhost:11434              │
│     Model: mistral:7b                        │
│                                               │
│  ─────────────────────────────────────       │
│  Provider Priority: Drag to reorder          │
│  1. Gemini  2. Groq  3. Ollama               │
└─────────────────────────────────────────────┘
```

### Storage

Provider configurations are stored in `localStorage` (same pattern as existing MCP server configs):

```typescript
interface LLMProviderConfig {
  id: string;
  name: string;
  apiKey: string;          // Encrypted or stored securely
  baseUrl: string;
  defaultModel: string;
  enabled: boolean;
  priority: number;
}

// localStorage key: 'foundry_llm_providers'
```

---

## Benefits of This Architecture

1. **Zero Cost to Start:** A user with no API keys at all can install Ollama and use the entire AI layer for free, running locally on their machine.

2. **Graceful Degradation:** If Groq hits its rate limit mid-session, the router silently falls back to Mistral or Cerebras. The user never sees an error.

3. **Maximize Free Quotas:** By spreading requests across 3-4 free providers, you effectively multiply your daily quota. Example:
   - Gemini: 1,500 RPD
   - Groq: 1,000 RPD  
   - Mistral: ~33,000 RPD (1B tokens/month ÷ 30 days ÷ ~1000 tokens per request)
   - **Total: ~35,500 free requests/day**

4. **Task-Optimized:** The image generation goes to Gemini (the only provider with free image gen). Speed-critical chat goes to Groq. Batch generation goes to Mistral. Each provider does what it's best at.

5. **Future-Proof:** Adding a new provider is just adding a new entry to the registry. The router handles everything else.

6. **Resume Gold:** This is a production-grade LLM orchestration layer — exactly the kind of infrastructure design that AI companies build internally.

---

## Implementation Steps

1. **Create `server/llm-router.ts`** — The core router class with provider registry, rate limiting, and fallback logic.
2. **Create `server/providers/`** — Individual provider adapters (most are OpenAI-compatible, so the base adapter covers 90% of them).
3. **Add Provider Settings UI** — New section in the Integrations/Settings view to configure API keys and drag-to-reorder priorities.
4. **Refactor `server.ts`** — Replace all direct `ai.models.generateContent()` calls with `llmRouter.chat()`.
5. **Refactor `agent-service/agents.py`** — For the Python agent, expose the router as an HTTP endpoint or configure the agent to use the selected provider.
6. **Add usage dashboard** — Show a small widget in the sidebar: "Today: 523 Gemini / 201 Groq / 0 Mistral"
