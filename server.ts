import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import dotenv from "dotenv";
import { WorkspaceItem, TimelineEntry, DecisionEntry, AttachmentEntry, MoodboardCard, Milestone } from "./src/types";
import { llmRouter, LLMProviderConfig, PROVIDER_PRESETS } from "./server/llm-router";

// Load environment variables early
dotenv.config();

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
const LLM_PROVIDERS_FILE = path.join(DB_DIR, "llm-providers.json");
const MCP_SERVERS_FILE = path.join(DB_DIR, "mcp-servers.json");

// ─── LLM Router Initialization ─────────────────────────────
function loadLLMProviders(): LLMProviderConfig[] {
  try {
    if (fs.existsSync(LLM_PROVIDERS_FILE)) {
      return JSON.parse(fs.readFileSync(LLM_PROVIDERS_FILE, "utf-8"));
    }
  } catch (e) {
    console.warn("[LLM Router] Could not load provider configs:", e);
  }
  return [];
}

function saveLLMProviders(providers: LLMProviderConfig[]): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(LLM_PROVIDERS_FILE, JSON.stringify(providers, null, 2));
}

// Load saved providers and ensure Gemini from .env is always available
const savedProviders = loadLLMProviders();
llmRouter.loadProviders(savedProviders);
llmRouter.ensureGeminiFromEnv();
const DB_FILE = path.join(DB_DIR, "db.json");
const ATTACHMENTS_DIR = path.join(DB_DIR, "attachments");
const MOODBOARD_DIR = path.join(DB_DIR, "moodboard");

// Ensure upload directories exist
[ATTACHMENTS_DIR, MOODBOARD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer config for attachments (md/pdf, max 10MB)
const attachmentStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const itemDir = path.join(ATTACHMENTS_DIR, req.params.id);
    if (!fs.existsSync(itemDir)) fs.mkdirSync(itemDir, { recursive: true });
    cb(null, itemDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, uniqueName);
  }
});
const uploadAttachment = multer({
  storage: attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.md', '.pdf'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .md and .pdf files are allowed'));
    }
  }
});

// Multer config for moodboard images (common image types, max 10MB)
const moodboardStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const itemDir = path.join(MOODBOARD_DIR, req.params.id);
    if (!fs.existsSync(itemDir)) fs.mkdirSync(itemDir, { recursive: true });
    cb(null, itemDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, uniqueName);
  }
});
const uploadMoodboardImage = multer({
  storage: moodboardStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Setup default Seed Data
const seedData: WorkspaceItem[] = [];

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

const MILESTONE_FILE = path.join(DB_DIR, "milestones.json");

// Read Milestones DB
function readMilestones(): Milestone[] {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(MILESTONE_FILE)) {
      fs.writeFileSync(MILESTONE_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const raw = fs.readFileSync(MILESTONE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read milestones database:", error);
    return [];
  }
}

// Write Milestones DB
function writeMilestones(data: Milestone[]) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(MILESTONE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write milestones database to disk:", error);
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
    decisions: req.body.decisions || [],
    attachments: req.body.attachments || [],
    moodboard: req.body.moodboard || []
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

// ======= ATTACHMENT ENDPOINTS =======

// Upload attachment (md/pdf)
app.post("/api/items/:id/attachments", uploadAttachment.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const data = readDatabase();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '') as 'md' | 'pdf';
  const attachment: AttachmentEntry = {
    id: `att-${Date.now()}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    type: ext,
    note: (req.body.note as string) || '',
    uploadedAt: new Date().toISOString()
  };

  if (!data[index].attachments) data[index].attachments = [];
  data[index].attachments.push(attachment);
  data[index].updatedAt = new Date().toISOString();
  writeDatabase(data);
  res.status(201).json(attachment);
});

// Serve attachment file
app.get("/api/attachments/:itemId/:filename", (req, res) => {
  const filePath = path.join(ATTACHMENTS_DIR, req.params.itemId, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.sendFile(filePath);
});

// Delete attachment
app.delete("/api/items/:id/attachments/:attachmentId", (req, res) => {
  const data = readDatabase();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  const attachment = (data[index].attachments || []).find(a => a.id === req.params.attachmentId);
  if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

  // Remove file from disk
  const filePath = path.join(ATTACHMENTS_DIR, req.params.id, attachment.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  data[index].attachments = (data[index].attachments || []).filter(a => a.id !== req.params.attachmentId);
  data[index].updatedAt = new Date().toISOString();
  writeDatabase(data);
  res.json({ success: true });
});

// Update attachment note
app.put("/api/items/:id/attachments/:attachmentId", (req, res) => {
  const data = readDatabase();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  const attIndex = (data[index].attachments || []).findIndex(a => a.id === req.params.attachmentId);
  if (attIndex === -1) return res.status(404).json({ error: 'Attachment not found' });

  data[index].attachments[attIndex].note = req.body.note || '';
  data[index].updatedAt = new Date().toISOString();
  writeDatabase(data);
  res.json(data[index].attachments[attIndex]);
});

// ======= MOODBOARD ENDPOINTS =======

// Add moodboard card (with optional image upload)
app.post("/api/items/:id/moodboard", uploadMoodboardImage.single('image'), (req, res) => {
  const data = readDatabase();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  const cardType = (req.body.type || 'note') as 'image' | 'note' | 'link';
  const card: MoodboardCard = {
    id: `mood-${Date.now()}`,
    type: cardType,
    content: req.body.content || '',
    caption: req.body.caption || '',
    imageFilename: req.file ? req.file.filename : undefined,
    url: req.body.url || undefined,
    createdAt: new Date().toISOString()
  };

  if (!data[index].moodboard) data[index].moodboard = [];
  data[index].moodboard.push(card);
  data[index].updatedAt = new Date().toISOString();
  writeDatabase(data);
  res.status(201).json(card);
});

// Serve moodboard image
app.get("/api/moodboard/:itemId/:filename", (req, res) => {
  const filePath = path.join(MOODBOARD_DIR, req.params.itemId, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.sendFile(filePath);
});

// Update moodboard card
app.put("/api/items/:id/moodboard/:cardId", (req, res) => {
  const data = readDatabase();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  const cardIndex = (data[index].moodboard || []).findIndex(c => c.id === req.params.cardId);
  if (cardIndex === -1) return res.status(404).json({ error: 'Card not found' });

  const card = data[index].moodboard[cardIndex];
  if (req.body.content !== undefined) card.content = req.body.content;
  if (req.body.caption !== undefined) card.caption = req.body.caption;
  if (req.body.url !== undefined) card.url = req.body.url;
  data[index].updatedAt = new Date().toISOString();
  writeDatabase(data);
  res.json(card);
});

// Delete moodboard card
app.delete("/api/items/:id/moodboard/:cardId", (req, res) => {
  const data = readDatabase();
  const index = data.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  const card = (data[index].moodboard || []).find(c => c.id === req.params.cardId);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  // Remove uploaded image from disk if exists
  if (card.imageFilename) {
    const filePath = path.join(MOODBOARD_DIR, req.params.id, card.imageFilename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  data[index].moodboard = (data[index].moodboard || []).filter(c => c.id !== req.params.cardId);
  data[index].updatedAt = new Date().toISOString();
  writeDatabase(data);
  res.json({ success: true });
});

// ======= MILESTONE ENDPOINTS =======

app.get("/api/milestones", (req, res) => {
  const data = readMilestones();
  const month = req.query.month as string;
  if (month) {
    const filtered = data.filter(m => m.date.startsWith(month));
    return res.json(filtered);
  }
  res.json(data);
});

app.post("/api/milestones", (req, res) => {
  const data = readMilestones();
  const newMilestone: Milestone = {
    ...req.body,
    id: `ms-${Date.now()}`
  };
  data.push(newMilestone);
  writeMilestones(data);
  res.status(201).json(newMilestone);
});

app.put("/api/milestones/:id", (req, res) => {
  const data = readMilestones();
  const index = data.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    const updated = { ...data[index], ...req.body };
    data[index] = updated;
    writeMilestones(data);
    res.json(updated);
  } else {
    res.status(404).json({ error: "Milestone not found" });
  }
});

app.delete("/api/milestones/:id", (req, res) => {
  const data = readMilestones();
  const filtered = data.filter(m => m.id !== req.params.id);
  if (filtered.length !== data.length) {
    writeMilestones(filtered);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Milestone not found" });
  }
});

// ======= STATS ENDPOINT =======

app.get("/api/stats", (req, res) => {
  const data = readDatabase();
  
  const totalItems = data.length;
  const activeItems = data.filter(i => !['Archived', 'Released'].includes(i.status)).length;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekCount = data.filter(i => new Date(i.createdAt) >= oneWeekAgo).length;
  
  const confidences = data.map(i => parseInt(i.confidence)).filter(c => !isNaN(c));
  const avgConfidence = confidences.length ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;
  
  const statuses = ['Captured', 'Expanded', 'Validated', 'Planning', 'Building', 'Released'];
  const statusDistribution = statuses.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<string, number>);
  
  data.forEach(item => {
    if (statusDistribution[item.status] !== undefined) {
      statusDistribution[item.status]++;
    } else if (item.status !== 'Archived') {
      statusDistribution[item.status] = 1;
    }
  });
  
  const staleItems = data.filter(i => new Date(i.updatedAt) < oneWeekAgo);
  
  // Activity Log (last 84 days)
  const activityLogMap: Record<string, number> = {};
  const eightyFourDaysAgo = new Date();
  eightyFourDaysAgo.setDate(eightyFourDaysAgo.getDate() - 84);
  
  data.forEach(item => {
    const createdDate = item.createdAt.split('T')[0];
    const updatedDate = item.updatedAt.split('T')[0];
    
    if (new Date(createdDate) >= eightyFourDaysAgo) {
      activityLogMap[createdDate] = (activityLogMap[createdDate] || 0) + 1;
    }
    if (updatedDate !== createdDate && new Date(updatedDate) >= eightyFourDaysAgo) {
      activityLogMap[updatedDate] = (activityLogMap[updatedDate] || 0) + 1;
    }
  });
  
  const activityLog = Object.entries(activityLogMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
    
  // Streak calculations
  const activeDates = new Set(activityLog.map(log => log.date));
  let currentStreak = 0;
  let longestStreak = 0;
  
  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date();
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr === today) {
      // It's today, allow it to be 0 for today but keep checking yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  const sortedActiveDates = Array.from(activeDates).sort();
  if (sortedActiveDates.length > 0) {
    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedActiveDates.length; i++) {
      const prev = new Date(sortedActiveDates[i - 1]);
      const curr = new Date(sortedActiveDates[i]);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
  }
  
  res.json({
    totalItems,
    activeItems,
    thisWeekCount,
    avgConfidence,
    statusDistribution,
    staleItems,
    activityLog,
    currentStreak,
    longestStreak
  });
});

// ─── LLM Provider API ──────────────────────────────────────

// Get available provider presets
app.get("/api/llm/presets", (_req, res) => {
  res.json(PROVIDER_PRESETS);
});

// Get current provider configs
app.get("/api/llm/providers", (_req, res) => {
  const providers = loadLLMProviders();
  // Mask API keys for security
  const masked = providers.map(p => ({
    ...p,
    apiKey: p.apiKey ? `${p.apiKey.slice(0, 4)}...${p.apiKey.slice(-4)}` : '',
  }));
  res.json(masked);
});

// Save provider configs (full replacement)
app.put("/api/llm/providers", (req, res) => {
  const providers: LLMProviderConfig[] = req.body.providers;
  if (!Array.isArray(providers)) {
    return res.status(400).json({ error: "providers must be an array" });
  }
  saveLLMProviders(providers);
  llmRouter.loadProviders(providers);
  llmRouter.ensureGeminiFromEnv();
  res.json({ success: true, count: providers.length });
});

// Add/update a single provider
app.post("/api/llm/providers", (req, res) => {
  const provider: LLMProviderConfig = req.body;
  if (!provider.id || !provider.name) {
    return res.status(400).json({ error: "Provider must have id and name" });
  }

  const providers = loadLLMProviders();
  const existingIdx = providers.findIndex(p => p.id === provider.id);
  if (existingIdx !== -1) {
    providers[existingIdx] = provider;
  } else {
    providers.push(provider);
  }

  saveLLMProviders(providers);
  llmRouter.loadProviders(providers);
  llmRouter.ensureGeminiFromEnv();
  res.json({ success: true, provider: { ...provider, apiKey: '***' } });
});

// Delete a provider
app.delete("/api/llm/providers/:id", (req, res) => {
  const providers = loadLLMProviders().filter(p => p.id !== req.params.id);
  saveLLMProviders(providers);
  llmRouter.loadProviders(providers);
  llmRouter.ensureGeminiFromEnv();
  res.json({ success: true });
});

// Get usage stats
app.get("/api/llm/usage", (_req, res) => {
  res.json(llmRouter.getUsageStats());
});

// ─── MCP Server Config API ─────────────────────────────────

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
  icon?: string;
  category?: string;
}

function loadMcpServers(): McpServerConfig[] {
  try {
    if (fs.existsSync(MCP_SERVERS_FILE)) {
      return JSON.parse(fs.readFileSync(MCP_SERVERS_FILE, "utf-8"));
    }
  } catch (e) {
    console.warn("[MCP] Could not load server configs:", e);
  }
  return [];
}

function saveMcpServers(servers: McpServerConfig[]): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(MCP_SERVERS_FILE, JSON.stringify(servers, null, 2));
}

// Get all MCP servers (tokens masked)
app.get("/api/mcp/servers", (_req, res) => {
  const servers = loadMcpServers();
  const masked = servers.map(s => ({
    ...s,
    apiToken: s.apiToken ? `${s.apiToken.slice(0, 4)}...${s.apiToken.slice(-4)}` : '',
  }));
  res.json(masked);
});

// Get all MCP servers with FULL tokens (internal only — used by agent trigger)
app.get("/api/mcp/servers/internal", (_req, res) => {
  res.json(loadMcpServers());
});

// Save all MCP servers (full replacement)
app.put("/api/mcp/servers", (req, res) => {
  const servers: McpServerConfig[] = req.body.servers;
  if (!Array.isArray(servers)) {
    return res.status(400).json({ error: "servers must be an array" });
  }
  saveMcpServers(servers);
  res.json({ success: true, count: servers.length });
});

// Add or update a single MCP server
app.post("/api/mcp/servers", (req, res) => {
  const server: McpServerConfig = req.body;
  if (!server.id || !server.name) {
    return res.status(400).json({ error: "Server must have id and name" });
  }

  const servers = loadMcpServers();
  const existingIdx = servers.findIndex(s => s.id === server.id);
  if (existingIdx !== -1) {
    servers[existingIdx] = server;
  } else {
    servers.push(server);
  }

  saveMcpServers(servers);
  res.json({ success: true, server: { ...server, apiToken: server.apiToken ? '***' : '' } });
});

// Delete an MCP server
app.delete("/api/mcp/servers/:id", (req, res) => {
  const servers = loadMcpServers().filter(s => s.id !== req.params.id);
  saveMcpServers(servers);
  res.json({ success: true });
});

// Check agent service health (real ping, not fake)
app.get("/api/mcp/status", async (_req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch("http://localhost:8000/docs", { signal: controller.signal });
    clearTimeout(timeout);
    res.json({ status: resp.ok ? "online" : "offline" });
  } catch {
    res.json({ status: "offline" });
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

  if (!llmRouter.hasProviders()) {
    return res.status(400).json({ 
      error: "No LLM providers configured. Please add at least one provider in Settings > LLM Providers." 
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

    const response = await llmRouter.chat({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      task: 'copilot',
      temperature: 0.2,
    });

    res.json({ content: response.content, provider: response.provider, model: response.model, latencyMs: response.latencyMs });
  } catch (error: any) {
    console.error("Co-Pilot error:", error);
    res.status(500).json({ error: error.message || "An error occurred while communicating with the LLM." });
  }
});

// --- Snapshot Version Control API ---

// Create manual snapshot
app.post("/api/items/:id/snapshots", (req, res) => {
  const { label } = req.body;
  const items = readDatabase();
  const index = items.findIndex(i => i.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Item not found" });
  }
  
  const item = items[index];
  const newSnapshotId = `snap-${Date.now()}`;
  
  const snapshot: any = {
    id: newSnapshotId,
    parentSnapshotId: item.activeSnapshotId || null,
    itemId: item.id,
    label: label || "Manual Snapshot",
    createdAt: new Date().toISOString(),
    createdBy: 'user',
    data: {
      title: item.title,
      summary: item.summary,
      problem: item.problem,
      proposedSolution: item.proposedSolution,
      uniqueInsight: item.uniqueInsight,
      targetAudience: item.targetAudience,
      validationHypothesis: item.validationHypothesis,
      mvp: item.mvp,
      businessModel: item.businessModel,
      technicalChallenges: item.technicalChallenges,
    }
  };
  
  if (!items[index].snapshots) items[index].snapshots = [];
  items[index].snapshots.push(snapshot);
  items[index].activeSnapshotId = newSnapshotId;
  items[index].updatedAt = new Date().toISOString();
  writeDatabase(items);
  
  res.json(snapshot);
});

// Restore snapshot
app.post("/api/items/:id/snapshots/:snapshotId/restore", (req, res) => {
  const items = readDatabase();
  const index = items.findIndex(i => i.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Item not found" });
  }
  
  const item = items[index];
  const snapshot = (item.snapshots || []).find((s: any) => s.id === req.params.snapshotId);
  
  if (!snapshot) {
    return res.status(404).json({ error: "Snapshot not found" });
  }
  
  // Restore fields
  items[index] = {
    ...item,
    title: snapshot.data.title,
    summary: snapshot.data.summary,
    problem: snapshot.data.problem,
    proposedSolution: snapshot.data.proposedSolution,
    uniqueInsight: snapshot.data.uniqueInsight,
    targetAudience: snapshot.data.targetAudience,
    validationHypothesis: snapshot.data.validationHypothesis,
    mvp: snapshot.data.mvp,
    businessModel: snapshot.data.businessModel,
    technicalChallenges: snapshot.data.technicalChallenges,
    activeSnapshotId: snapshot.id,
    updatedAt: new Date().toISOString()
  };
  
  writeDatabase(items);
  res.json(items[index]);
});

// AI Pivot
app.post("/api/items/:id/snapshots/pivot", async (req, res) => {
  const { pivotPrompt } = req.body;
  const items = readDatabase();
  const index = items.findIndex(i => i.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Item not found" });
  }
  
  if (!llmRouter.hasProviders()) {
    return res.status(400).json({ error: "No LLM providers configured." });
  }

  const item = items[index];
  
  // Create a base snapshot of current state BEFORE pivot if there isn't an active one
  if (!item.activeSnapshotId) {
    const baseSnap: any = {
      id: `snap-base-${Date.now()}`,
      parentSnapshotId: null,
      itemId: item.id,
      label: "Base Version",
      createdAt: new Date().toISOString(),
      createdBy: 'user',
      data: {
        title: item.title,
        summary: item.summary,
        problem: item.problem,
        proposedSolution: item.proposedSolution,
        uniqueInsight: item.uniqueInsight,
        targetAudience: item.targetAudience,
        validationHypothesis: item.validationHypothesis,
        mvp: item.mvp,
        businessModel: item.businessModel,
        technicalChallenges: item.technicalChallenges,
      }
    };
    if (!items[index].snapshots) items[index].snapshots = [];
    items[index].snapshots.push(baseSnap);
    items[index].activeSnapshotId = baseSnap.id;
  }

  try {
    const prompt = `
You are an expert product strategist. Your task is to pivot the current product concept into a new direction based on the user's instructions.

Original Concept:
Title: ${item.title}
Summary: ${item.summary}
Problem: ${item.problem}
Solution: ${item.proposedSolution}
Insight: ${item.uniqueInsight}
Target Audience: ${item.targetAudience}
Business Model: ${item.businessModel}

Pivot Instruction:
"${pivotPrompt}"

Return the entire pivoted product concept as a JSON object matching this schema exactly. DO NOT use markdown code blocks, just raw JSON text.
{
  "title": "...",
  "summary": "...",
  "problem": "...",
  "proposedSolution": "...",
  "uniqueInsight": "...",
  "targetAudience": "...",
  "validationHypothesis": "...",
  "mvp": "...",
  "businessModel": "...",
  "technicalChallenges": "..."
}
`;

    const response = await llmRouter.chat({
      messages: [
        { role: 'user', content: prompt },
      ],
      task: 'pivot',
      responseFormat: 'json',
      temperature: 0.7,
    });

    const aiText = response.content;
    const pivotedData = JSON.parse(aiText);
    
    const pivotSnapshotId = `snap-pivot-${Date.now()}`;
    const pivotSnapshot: any = {
      id: pivotSnapshotId,
      parentSnapshotId: items[index].activeSnapshotId,
      itemId: item.id,
      label: `Pivot: ${pivotPrompt.slice(0, 30)}...`,
      createdAt: new Date().toISOString(),
      createdBy: 'ai',
      aiPrompt: pivotPrompt,
      data: {
        title: pivotedData.title || item.title,
        summary: pivotedData.summary || item.summary,
        problem: pivotedData.problem || item.problem,
        proposedSolution: pivotedData.proposedSolution || item.proposedSolution,
        uniqueInsight: pivotedData.uniqueInsight || item.uniqueInsight,
        targetAudience: pivotedData.targetAudience || item.targetAudience,
        validationHypothesis: pivotedData.validationHypothesis || item.validationHypothesis,
        mvp: pivotedData.mvp || item.mvp,
        businessModel: pivotedData.businessModel || item.businessModel,
        technicalChallenges: pivotedData.technicalChallenges || item.technicalChallenges,
      }
    };
    
    // Apply pivot data to main item immediately
    items[index] = {
      ...items[index],
      ...pivotSnapshot.data,
      activeSnapshotId: pivotSnapshotId,
      updatedAt: new Date().toISOString()
    };
    
    items[index].snapshots.push(pivotSnapshot);
    writeDatabase(items);
    
    res.json(items[index]);
  } catch (error: any) {
    console.error("AI Pivot error:", error);
    res.status(500).json({ error: "Failed to perform AI pivot." });
  }
});

// Antigravity Agent Trigger Endpoint
app.post("/api/antigravity/research", async (req, res) => {
  const { itemId, prompt } = req.body;
  const items = readDatabase();
  const item = items.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: "Workspace Item not found" });
  }

  try {
    // Send request to Python service
    const pythonServiceUrl = "http://localhost:8000/api/research";
    // We need to pass the IP the Python service can reach. For local dev, 127.0.0.1 is fine.
    const callbackUrl = `http://127.0.0.1:${PORT}/api/antigravity/callback`;
    const progressUrl = `http://127.0.0.1:${PORT}/api/antigravity/progress`;
    const traceUrl = `http://127.0.0.1:${PORT}/api/antigravity/trace`;
    
    // Set status to running
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index].agentStatus = 'running';
      items[index].agentProgress = 'Initializing Agent...';
      items[index].agentTrace = [];
      items[index].updatedAt = new Date().toISOString();
      writeDatabase(items);
    }
    
    // Load enabled MCP servers from backend config (not from frontend)
    const allMcpServers = loadMcpServers();
    const enabledMcpServers = allMcpServers
      .filter(s => s.enabled)
      .map(s => ({
        id: s.id,
        name: s.name,
        type: s.type || "stdio",
        command: s.command || null,
        args: s.args || null,
        url: s.url || null,
        api_token: s.apiToken || null,
        env_key: s.envKey || null,
      }));

    const response = await fetch(pythonServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: item.id,
        title: item.title || "",
        summary: item.summary || "",
        problem: item.problem || "",
        proposed_solution: item.proposedSolution || "",
        unique_insight: item.uniqueInsight || "",
        target_audience: item.targetAudience || "",
        prompt: prompt || "",
        callback_url: callbackUrl,
        progress_url: progressUrl,
        trace_url: traceUrl,
        mcp_servers: enabledMcpServers
      })
    });
    
    if (!response.ok) {
      throw new Error(`Python service responded with status ${response.status}`);
    }
    
    res.json({ success: true, message: "Agent started in background" });
  } catch (error: any) {
    console.error("Failed to start agent:", error);
    
    // Reset status on failure
    const items = readDatabase();
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index].agentStatus = 'error';
      items[index].agentProgress = 'Failed to start agent service';
      writeDatabase(items);
    }
    
    res.status(500).json({ error: error.message || "Failed to contact Antigravity service." });
  }
});

// Callback from Python service
app.post("/api/antigravity/callback", async (req, res) => {
  const { item_id, status, result, error, usage, trace } = req.body;
  
  if (status === "completed") {
    // Add result as an attachment to the item
    const items = readDatabase();
    const index = items.findIndex(i => i.id === item_id);
    
    if (index !== -1) {
      const attachment: AttachmentEntry = {
        id: `att-agent-${Date.now()}`,
        filename: `research_${Date.now()}.md`,
        originalName: `Agent_Research.md`,
        type: 'md',
        note: 'Generated by Antigravity Agent',
        uploadedAt: new Date().toISOString()
      };
      
      // Save the markdown file to disk
      const itemDir = path.join(ATTACHMENTS_DIR, item_id);
      if (!fs.existsSync(itemDir)) fs.mkdirSync(itemDir, { recursive: true });
      fs.writeFileSync(path.join(itemDir, attachment.filename), result);
      
      if (!items[index].attachments) items[index].attachments = [];
      items[index].attachments.push(attachment);
      items[index].agentStatus = 'completed';
      items[index].agentProgress = 'Report attached';
      items[index].updatedAt = new Date().toISOString();
      if (usage) {
        items[index].agentTokens = usage;
      }
      if (trace) {
        items[index].agentTrace = trace;
      }
      writeDatabase(items);
      
      console.log(`Agent research saved for item ${item_id}`);
    }
  } else {
    // Handle error
    const items = readDatabase();
    const index = items.findIndex(i => i.id === item_id);
    if (index !== -1) {
      items[index].agentStatus = 'error';
      items[index].agentProgress = `Error: ${error}`;
      items[index].updatedAt = new Date().toISOString();
      if (usage) {
        items[index].agentTokens = usage;
      }
      if (trace) {
        items[index].agentTrace = trace;
      }
      writeDatabase(items);
    }
    console.error(`Agent failed for item ${item_id}: ${error}`);
  }
  
  res.json({ success: true });
});

// Live trace event from Python service
app.post("/api/antigravity/trace", async (req, res) => {
  const { item_id, trace_event } = req.body;
  const items = readDatabase();
  const index = items.findIndex(i => i.id === item_id);
  
  if (index !== -1 && trace_event) {
    if (!items[index].agentTrace) items[index].agentTrace = [];
    items[index].agentTrace.push(trace_event);
    items[index].updatedAt = new Date().toISOString();
    writeDatabase(items);
  }
  
  res.json({ success: true });
});

// Progress update from Python service
app.post("/api/antigravity/progress", async (req, res) => {
  const { item_id, progress } = req.body;
  const items = readDatabase();
  const index = items.findIndex(i => i.id === item_id);
  
  if (index !== -1 && items[index].agentStatus === 'running') {
    items[index].agentProgress = progress;
    items[index].updatedAt = new Date().toISOString();
    writeDatabase(items);
  }
  
  res.json({ success: true });
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
