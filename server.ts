import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import { WorkspaceItem, TimelineEntry, DecisionEntry, AttachmentEntry, MoodboardCard, Milestone } from "./src/types";

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
