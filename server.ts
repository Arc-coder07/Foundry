import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { WorkspaceItem, TimelineEntry, DecisionEntry } from "./src/types";

// Initialize Gemini SDK safely
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to persist JSON database
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Setup default Seed Data
const seedData: WorkspaceItem[] = [
  {
    id: "neural-mesh-v2",
    type: "Idea",
    title: "Autonomous Neural Mesh for distributed edge-compute optimization.",
    summary: "A decentralized compute protocol pooling idle hardware for localized WASM execution.",
    status: "Captured",
    problem: "Centralized cloud architectures are hitting a latency ceiling for real-time inference. As IoT devices proliferate, the energy cost of data transport outweighs the value of the computation itself. Current edge solutions are too siloed to handle dynamic resource allocation.",
    proposedSolution: "A decentralized protocol that treats individual edge devices as peer-to-peer nodes in a global compute fabric. By using lightweight WASM runtimes and a gossip protocol for task distribution, we reduce latency by 400% while utilizing idle hardware capacity.",
    uniqueInsight: "Hardware isn't the bottleneck—it's the static nature of task assignment. If compute can flow like water to the path of least resistance, we eliminate the need for massive data centers in 60% of common use cases.",
    targetAudience: "Founders, indie hackers, IoT developers, and edge-computing researchers.",
    validationHypothesis: "By clustering 10 Raspberry Pis running our lightweight gossip daemon, we can demonstrate reliable 15ms latency task-failover and load balancing under extreme synthetic traffic.",
    mvp: "1. Zero-config node discovery protocol (Gossip-based).\n2. WASM-compatible sandbox for secure, multi-tenant execution.\n3. Lightweight billing layer for micro-transactional compute rewards.",
    longTermVision: "A global, trustless compute utility where any phone, router, or smart device can lease its idle silicon to a distributed AI model execution pool.",
    businessModel: "10% network commission on all micro-transactional computation leases between nodes.",
    technicalChallenges: "Ensuring sandbox security within WASM for multi-tenant code execution; mitigating Byzantine actors manipulating gossip states; minimizing power consumption on battery-limited edge nodes.",
    provenance: "OCT 12, 2023",
    source: "WHITEBOARD",
    confidence: "85%",
    priority: "High",
    interestLevel: "9/10",
    difficulty: "Hard",
    tags: ["EDGE", "WASM", "P2P", "AI"],
    collection: "AI",
    pinned: true,
    createdAt: new Date("2023-10-12T10:00:00Z").toISOString(),
    updatedAt: new Date("2023-10-14T14:30:00Z").toISOString(),
    relatedIds: ["gossip-protocol-v1", "edge-database"],
    timeline: [
      {
        id: "t1",
        version: "v2.1 Current",
        title: "Added WASM runtime specifics",
        date: "OCT 14, 2023",
        summary: "Specified WASM runtime parameters and integrated structural details for isolation barriers."
      },
      {
        id: "t2",
        version: "v2.0 Revision",
        title: "Shifted to P2P",
        date: "OCT 12, 2023",
        summary: "Moved away from hub-and-spoke federated nodes to a fully decentralized gossip protocol."
      }
    ],
    decisions: [
      {
        id: "d1",
        status: "Decided",
        title: "Rust for Node Client",
        content: "Use Rust for the node client instead of Go to minimize binary size."
      },
      {
        id: "d2",
        status: "Pending",
        title: "ARM64 Compatibility",
        content: "Whether to support ARM64 at launch or focus on x86 servers first."
      }
    ]
  },
  {
    id: "gossip-protocol-v1",
    type: "Research",
    title: "Mesh-Gossip Protocol performance analysis in volatile networks.",
    summary: "Simulating packet loss and node churn across distributed P2P topologies.",
    status: "Expanded",
    problem: "Existing gossip protocols (like swim or scuttlebutt) assume relative stability, but edge-compute nodes have high churn rates (devices disconnecting constantly) leading to split-brain states.",
    proposedSolution: "Introduce a weighted epoch mechanism where node trust scales with uptime, and historical latency measures dictate message route prioritization.",
    uniqueInsight: "A transient node shouldn't broadcast state updates immediately. Buffering updates at high-uptime regional 'anchors' reduces peer-to-peer connection overhead by 70%.",
    targetAudience: "Systems engineers, network architects, decentralized protocol builders.",
    validationHypothesis: "Running simulations with 50% node churn to show that weighted gossip converges state 3x faster than standard anti-entropy rounds.",
    mvp: "1. Python network model simulating 1000 nodes with random drops.\n2. Mathematical proof of weighted epoch convergence boundaries.\n3. Draft API spec for gossip carrier interfaces.",
    longTermVision: "A standardized layer-0 networking framework that any smart mesh or IoT system can drop in for sub-second, resilient consensus.",
    businessModel: "Open source framework with dual-licensing (AGPLv3 / Commercial) for private enterprise grids.",
    technicalChallenges: "Formulating peer-selection rules that resist Sybil attacks without a centralized coordinator.",
    provenance: "SEPT 28, 2023",
    source: "LITERATURE REVIEW",
    confidence: "90%",
    priority: "Medium",
    interestLevel: "8/10",
    difficulty: "Hard",
    tags: ["CONSENSUS", "NETWORKING", "RESEARCH"],
    collection: "Research",
    pinned: false,
    createdAt: new Date("2023-09-28T08:15:00Z").toISOString(),
    updatedAt: new Date("2023-10-02T11:00:00Z").toISOString(),
    relatedIds: ["neural-mesh-v2"],
    timeline: [
      {
        id: "t1",
        version: "v1.0 Current",
        title: "Initial draft published",
        date: "OCT 02, 2023",
        summary: "Drafted weighted epoch algorithms and shared mathematical models."
      }
    ],
    decisions: [
      {
        id: "d1",
        status: "Decided",
        title: "AGPLv3 Selection",
        content: "Decided on AGPLv3 for the open source version to ensure network improvements are upstreamed."
      }
    ]
  },
  {
    id: "edge-database",
    type: "Architecture",
    title: "Edge-Native Multi-Tenant Database design parameters.",
    summary: "An ultra-compact key-value store optimized for flash storage and transactional WASM execution.",
    status: "Validated",
    problem: "Standard relational databases are too heavy for edge nodes with 128MB RAM, while SQLite lacks concurrent multi-tenant isolation out of the box.",
    proposedSolution: "A pure-Rust LSM-tree micro-database that provides virtualized schema barriers for separate tenants within the same memory block.",
    uniqueInsight: "Tenants don't need independent write-ahead logs. Coalescing write-ahead operations into a single append-only log with tenant namespaces preserves flash lifecycle by 40%.",
    targetAudience: "Database builders, system architects, embedded systems developers.",
    validationHypothesis: "Benchmark write speeds of 50k transactions/sec inside a 10MB memory envelope.",
    mvp: "1. Basic LSM-tree engine writing to virtual files.\n2. Tenant encryption envelope prototype.\n3. Simple KV GET/SET interface.",
    longTermVision: "The sqlite-equivalent database for the decentralized web.",
    businessModel: "Support contracts, enterprise security audits, and cloud syncing proxies.",
    technicalChallenges: "Compacting segments without locking reads in low-RAM scenarios; ensuring cryptographic isolation of keys between distinct tenants.",
    provenance: "AUG 19, 2023",
    source: "BRAINSTORM",
    confidence: "75%",
    priority: "Low",
    interestLevel: "8/10",
    difficulty: "Medium",
    tags: ["DATABASE", "RUST", "STORAGE"],
    collection: "AI",
    pinned: true,
    createdAt: new Date("2023-08-19T14:00:00Z").toISOString(),
    updatedAt: new Date("2023-08-25T09:20:00Z").toISOString(),
    relatedIds: ["neural-mesh-v2"],
    timeline: [
      {
        id: "t1",
        version: "v1.1 Current",
        title: "Validated compaction scheme",
        date: "AUG 25, 2023",
        summary: "Tested background compaction limits under memory throttling."
      }
    ],
    decisions: []
  }
];

// Read DB from disk or initialize with seed data
function readDatabase(): WorkspaceItem[] {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), "utf-8");
      return seedData;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read database, falling back to seed data:", error);
    return seedData;
  }
}

// Write DB to disk
function writeDatabase(data: WorkspaceItem[]) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write database to disk:", error);
  }
}

// REST API Endpoints
app.get("/api/items", (req, res) => {
  const data = readDatabase();
  res.json(data);
});

app.get("/api/items/:id", (req, res) => {
  const data = readDatabase();
  const item = data.find(i => i.id === req.params.id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

app.post("/api/items", (req, res) => {
  const data = readDatabase();
  const newItem: WorkspaceItem = {
    ...req.body,
    id: req.body.id || `item-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: req.body.timeline || [
      {
        id: `t-${Date.now()}`,
        version: "v1.0 Current",
        title: "Idea captured",
        date: new Date().toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
        summary: "Initial thoughts captured into Foundry."
      }
    ],
    decisions: req.body.decisions || []
  };
  
  data.push(newItem);
  writeDatabase(data);
  res.status(201).json(newItem);
});

app.put("/api/items/:id", (req, res) => {
  const data = readDatabase();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index !== -1) {
    const updatedItem = {
      ...data[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    data[index] = updatedItem;
    writeDatabase(data);
    res.json(updatedItem);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

app.delete("/api/items/:id", (req, res) => {
  const data = readDatabase();
  const filtered = data.filter(i => i.id !== req.params.id);
  if (filtered.length !== data.length) {
    writeDatabase(filtered);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

// Co-Pilot AI Assist Endpoint
app.post("/api/copilot", async (req, res) => {
  const { itemId, action, customPrompt } = req.body;
  const items = readDatabase();
  const item = items.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: "Workspace Item not found" });
  }

  if (!ai) {
    return res.status(400).json({ 
      error: "Gemini API key is missing. Please configure GEMINI_API_KEY inside Settings > Secrets." 
    });
  }

  try {
    let systemInstruction = "";
    let prompt = "";

    if (action === "improve") {
      systemInstruction = "You are an elite Product Thinking assistant. Your goal is to improve the prose of the product proposal to make it crisp, compelling, and impactful. Maintain a professional, executive tone. Keep formatting minimal with neat markdown. Avoid preambles, just give the improved output.";
      prompt = `
Here is the product details:
Title: ${item.title}
Summary: ${item.summary}
Problem: ${item.problem}
Solution: ${item.proposedSolution}
Unique Insight: ${item.uniqueInsight}

Analyze this proposal and return an improved version of the core sections. Provide the results under clear headers:
### Improved Core Premise
### Refined Problem Statement
### Optimized Proposed Solution
`;
    } else if (action === "audit") {
      systemInstruction = "You are a critical, brilliant venture capitalist and Staff Engineer. Your job is to perform a rigorous SWOT analysis and find critical weaknesses, assumptions, and friction points in this product proposal. Be direct, crisp, and objective. Offer concrete mitigation strategies.";
      prompt = `
Workspace Item details:
Title: ${item.title}
Summary: ${item.summary}
Problem: ${item.problem}
Solution: ${item.proposedSolution}
Unique Insight: ${item.uniqueInsight}
Target Audience: ${item.targetAudience}

Please perform a strategic audit on this item. Structure your feedback in clear sections using Markdown:
### 🔴 Critical Vulnerabilities & Blindspots
List 2-3 severe risks or unverified assumptions in their thinking.
### 🟡 Operational & Technical Hardships
What makes this exceptionally difficult to build or distribute?
### 🟢 Mitigating Recommendations
Concrete, realistic pivot paths or validation experiments to reduce risk.
`;
    } else if (action === "expand") {
      systemInstruction = "You are a world-class Product Architect, Tech Lead, and Business Strategist. Your job is to expand an early-stage workspace item into full technical architecture, MVP boundaries, a phased roadmap, a clear business model, and estimated technical complexity.";
      prompt = `
Workspace Item details:
Title: ${item.title}
Summary: ${item.summary}
Problem: ${item.problem}
Solution: ${item.proposedSolution}
Unique Insight: ${item.uniqueInsight}
Target Audience: ${item.targetAudience}

Please expand this idea into a robust build strategy. Return beautiful, organized markdown sections:
### 🎯 Defined MVP boundaries & Feature Scope
What should be in the initial release vs later phases?
### 🏗️ Proposed Technical Architecture
Which standards, design patterns, or system block diagrams fit this best?
### 🗓️ Phased Implementation Roadmap
Provide a 3-stage plan (Stage 1: Core foundation, Stage 2: Integration, Stage 3: Scale).
### 💰 Monetization & Value Capture
Recommend a strong monetization model.
### ⚡ Technical Complexity Estimation
Score complexity from 1 to 10 (with detailed rationale).
`;
    } else {
      // Custom prompt
      systemInstruction = "You are an expert product OS co-pilot named Foundry Co-Pilot. Help the user answer questions or perform work related to their product idea.";
      prompt = `
Workspace Item context:
Title: ${item.title}
Summary: ${item.summary}
Problem: ${item.problem}
Solution: ${item.proposedSolution}
Unique Insight: ${item.uniqueInsight}

User's instruction/request:
"${customPrompt}"
`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    const aiText = response.text || "No response received from Gemini.";
    res.json({ content: aiText });
  } catch (error: any) {
    console.error("Gemini Co-Pilot error:", error);
    res.status(500).json({ error: error.message || "An error occurred while communicating with the Gemini API." });
  }
});

// Setup dev/prod servers
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log();
    console.log(`  VITE v6.x.x  ready in custom Express server`);
    console.log();
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`  ➜  API:     Running Foundry Product Thinking OS`);
    console.log();
  });
}

startServer();
