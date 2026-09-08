<div align="center">
  <img alt="Foundry Hero Banner" src="assets/foundry_banner_light_cropped.jpg" width="100%">
  
  <br/>
  <br/>

  <h1>🚀 Foundry</h1>
  
  <p>
    <b>Go from messy thought to shipping-ready spec in 5 minutes.</b>
  </p>

  <p>
    Capture an idea by voice or text → AI structures it into a dev-ready spec with user stories and edge cases → Push directly to Linear or GitHub and start building.
  </p>

  <p>
    <a href="#features"><strong>Features</strong></a> ·
    <a href="#how-it-works"><strong>How It Works</strong></a> ·
    <a href="#architecture"><strong>Architecture</strong></a> ·
    <a href="#getting-started"><strong>Getting Started</strong></a> ·
    <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
    <a href="#roadmap"><strong>Roadmap</strong></a>
  </p>

  <br/>
</div>

---

## 💡 What is Foundry?

Foundry is the execution bridge between a raw idea and your first commit.

Most "idea validation" tools generate feel-good reports — *"Your TAM is $100B!"* — that create an illusion of progress. Foundry does the opposite. It acts as your **skeptical CTO**: structuring messy thoughts into dev-ready specs, surfacing the edge cases that'll break your feature on day 1, and pushing actionable issues directly into Linear or GitHub so you can start building immediately.

**The core loop:**

```
🎙️ Voice or Text Brain Dump
       ↓
📝 Structured Canvas (Problem, Solution, Audience)
       ↓
🧠 "Expand" → Dev-Ready Spec (User Stories, Acceptance Criteria, Data Model, API Endpoints)
       ↓
🔴 "Devil's Advocate" → Edge Cases, Engineering Objections, Failure Modes
       ↓
🚀 Push → Linear Issues / GitHub Issues
       ↓
💻 Start Coding
```

**The test for every feature:** *"Does this get me from idea → first commit faster?"* If not, it doesn't belong in Foundry.

---

## ✨ Features

### 🎙️ Voice-to-Idea (Rambling Parser)
Capture messy, unstructured thoughts on the go — walking, driving, between meetings — and let AI instantly parse them into structured canvas fields (Problem, Solution, Target Audience, Edge Cases). No more audio graveyards. Your best product insights happen away from the keyboard; Foundry catches them.

### 📝 Structured Idea Canvas
Define problem statements, proposed solutions, unique insights, and target audiences in a rich Markdown editor. The canvas is the single source of truth that feeds every downstream AI action.

### 🧠 AI "Expand" → Dev-Ready Spec
One click transforms your idea into an engineering-ready specification:
- **User Stories** — *As a [user], I want to [action], so that [outcome]*
- **Acceptance Criteria** — Gherkin format (*Given / When / Then*)
- **Data Model** — Tables, relationships, and constraints in plain English
- **API Endpoints** — Method, path, request/response shape
- **Edge Cases & Error States** — What will break on day 1

This is what [ChatPRD](https://chatprd.ai/) proved founders pay $15/mo for — not generic 15-page enterprise PRD templates.

### 🔴 AI "Devil's Advocate" (Audit)
AI acts as your most skeptical CTO / co-founder:
- *"Give me 5 reasons an engineer would reject this architecture."*
- *"What edge cases will break this feature on day 1?"*
- *"What will a user complain about in the first week?"*

No SWOT fluff. No "your market is huge!" validation theater. Just **structured doubt** — the only thing founders actually trust AI for.

### 🚀 Push to Linear / GitHub Issues
After Expand generates your dev-ready spec, one button creates actionable issues directly in **Linear** or **GitHub Issues** from the feature list. No manual copy-paste. Converts Foundry from a thinking tool into an **execution bridge**.

### 💻 Code Scaffold Generation
Generate working React + Tailwind boilerplate for landing pages and waitlists, pre-loaded with your product context from the canvas. Export or push directly to GitHub.

### AI & Agent Layer
- **⚡ Autonomous Agent (Antigravity)** — Deep research and automated analysis via a custom Python FastAPI microservice with full MCP tool integration
- **🔍 Agent Traceability UI** — Full interpretability panel showing the agent's exact chain-of-thought, every tool call, raw outputs, and execution timing
- **🔀 Multi-Provider LLM Router** — Route AI requests across **6 free-tier providers** (Gemini, Groq, Mistral, Cerebras, OpenRouter, Ollama) with automatic fallback, rate limiting, and task-aware model selection. Stack ~35,000+ free requests/day
- **🌳 Idea Version Control** — Snapshot ideas, pivot them in new directions, and visualize the evolution as an interactive branch tree (powered by React Flow)

### Integrations & Ecosystem
- **🔌 MCP Integrations** — Connect external tools (GitHub, Linear, Brave Search, Slack, Notion, Filesystem) via Model Context Protocol servers
- **📎 Attachments** — Local file uploads with `multer` for documents and reference materials

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                     CAPTURE                              │
│  🎙️ Voice memo → AI transcribes & parses                │
│  ⌨️ Text brain dump → structured canvas fields           │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     STRUCTURE                            │
│  📝 Canvas: Problem · Solution · Unique Insight          │
│              Target Audience · Tags                      │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   AI ACTIONS                             │
│  🧠 Expand → User Stories, Acceptance Criteria,          │
│              Data Model, API Endpoints                   │
│  🔴 Devil's Advocate → Edge Cases, Objections,           │
│                        Failure Modes                     │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     EXECUTE                              │
│  🚀 Push to Linear Issues / GitHub Issues                │
│  💻 Generate code scaffold → push to GitHub              │
│  🔗 Open in Cursor / VS Code and start coding            │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React 19 Frontend                     │
│  Editor · Co-Pilot · Agent Trace · Version Tree          │
│  Voice Capture · Timeline · Command Palette · Settings   │
├─────────────────────────────────────────────────────────┤
│                 Node.js / Express Backend                │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  LLM Router  │  │  REST API    │  │  MCP Bridge  │  │
│  │  (6 providers│  │  (Items,     │  │  (Tool       │  │
│  │   w/ fallback│  │   Snapshots, │  │   calling)   │  │
│  │   & rate lim)│  │   Push-to-   │  │              │  │
│  │              │  │   Linear/GH) │  │              │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
│  ┌──────▼──────────────────────────────────────────┐    │
│  │ Gemini → Groq → Mistral → Cerebras → Ollama    │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│            Python FastAPI Agent Service                  │
│  Antigravity Agents · Telemetry Hooks · MCP Tools        │
├─────────────────────────────────────────────────────────┤
│                   JSON File Database                     │
│              data/db.json · attachments                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | UI framework & dev server |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [Framer Motion](https://motion.dev/) | Animations & transitions |
| [@xyflow/react](https://reactflow.dev/) | Interactive node-based diagrams |
| [Lucide React](https://lucide.dev/) | Icon system |
| `react-markdown` + `mermaid` | Rich Markdown rendering with diagrams |
| Web Audio API | Voice capture & transcription |

### Backend & AI
| Technology | Purpose |
|---|---|
| [Express](https://expressjs.com/) + [Node.js](https://nodejs.org/) | REST API server |
| [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety |
| `@google/genai` (Gemini API) | Primary AI provider |
| Multi-Provider LLM Router | Groq, Mistral, Cerebras, OpenRouter, Ollama |
| [Python FastAPI](https://fastapi.tiangolo.com/) | Autonomous agent microservice |
| [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) | Tool calling & external integrations |
| [multer](https://github.com/expressjs/multer) | File upload handling |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Python 3.10+](https://www.python.org/) (for the agent service)
- `npm`

### Installation

```bash
# Clone the repo
git clone https://github.com/Arc-coder07/Foundry.git
cd Foundry

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GEMINI_API_KEY (free at https://aistudio.google.com)

# Run the development server
npm run dev
```

### Optional: Add Free LLM Providers

Foundry works with just a Gemini key, but you can add more providers for free to maximize your AI quota:

1. Open the app → **Settings > LLM Providers**
2. Add API keys from any of these (all free, no credit card):
   - [Groq](https://console.groq.com) — Ultra-fast inference
   - [Mistral](https://console.mistral.ai) — High volume (1B tokens/month)
   - [Cerebras](https://cloud.cerebras.ai) — High throughput
   - [OpenRouter](https://openrouter.ai) — Model variety
3. Or install [Ollama](https://ollama.com) for unlimited local AI with zero API keys

---

## 📸 Screenshots

<div align="center">
  <img src="assets/foundry_workspace_screenshot.png" alt="Foundry Workspace" width="80%" style="border-radius: 8px; box-shadow: 0px 4px 15px rgba(0,0,0,0.1); margin-bottom: 20px;"/>
  <br/><br/>
  <img src="assets/foundry_timeline_screenshot.png" alt="Forge Timeline" width="80%" style="border-radius: 8px; box-shadow: 0px 4px 15px rgba(0,0,0,0.1); margin-bottom: 20px;"/>
  <br/><br/>
  <img src="assets/foundry_integrations_screenshot.png" alt="MCP Integrations" width="80%" style="border-radius: 8px; box-shadow: 0px 4px 15px rgba(0,0,0,0.1);"/>
</div>

---

## 📁 Project Structure

```
Foundry/
├── server.ts                  # Express backend + LLM Router init
├── server/
│   └── llm-router.ts          # Multi-provider LLM abstraction layer
├── agent-service/
│   ├── agents.py              # Antigravity agent with telemetry hooks
│   └── main.py                # FastAPI endpoints for agent tasks
├── src/
│   ├── App.tsx                # Main application shell
│   ├── types.ts               # Shared TypeScript interfaces
│   └── components/
│       ├── Editor.tsx          # Workspace editor (canvas, co-pilot, trace, versions)
│       ├── AgentTracePanel.tsx # Agent interpretability timeline
│       ├── IdeaVersionTree.tsx # React Flow version branching
│       ├── LLMProviderSettings.tsx # Multi-provider config UI
│       ├── IntegrationsView.tsx # MCP server management
│       ├── CoPilotDrawer.tsx   # AI assist drawer (Expand / Devil's Advocate)
│       ├── HomeView.tsx        # Dashboard with quick capture & recent ideas
│       └── ...
├── docs/                      # Feature designs & roadmap
└── data/                      # JSON database & uploads
```

---

## 🗺️ Roadmap

| Priority | Feature | Status |
|---|---|---|
| 🔴 P0 | **Voice-to-Idea** — Web Audio API → transcribe → parse into canvas fields | 🚧 In Progress |
| 🔴 P0 | **Dev-Ready Expand** — User Stories + Acceptance Criteria + Data Model output | ✅ Shipped |
| 🔴 P0 | **Devil's Advocate Audit** — Engineer-focused objections & edge cases | ✅ Shipped |
| 🟡 P1 | **Push to GitHub Issues** — Create issues from expanded spec via MCP | 🔜 Next |
| 🟡 P1 | **Push to Linear** — Create Linear issues from expanded spec via MCP | 🔜 Next |
| 🟢 P2 | **Code Scaffold** — React + Tailwind landing page from canvas context | 📋 Planned |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Check [ISSUES.md](ISSUES.md) for known issues.

## 📄 License

This project is private and proprietary unless otherwise stated.

---
<div align="center">
  <i>Built for builders who ship, not builders who plan to plan.</i>
</div>
