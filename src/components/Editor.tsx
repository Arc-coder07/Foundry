import React, { useState, useEffect, useRef } from "react";
import { 
  Pin, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Gavel, 
  Clock, 
  Calendar,
  Share2,
  FolderMinus,
  Sparkles,
  Link as LinkIcon,
  PenTool,
  Palette
} from "lucide-react";
import { WorkspaceItem, TimelineEntry, DecisionEntry, AttachmentEntry, MoodboardCard } from "../types";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { MoodboardView } from "./MoodboardView";

interface EditorProps {
  item: WorkspaceItem;
  allItems: WorkspaceItem[];
  onUpdate: (updated: WorkspaceItem) => void;
  onDelete: (id: string) => void;
  onSwitchItem: (id: string) => void;
  isSyncing: boolean;
}

export function Editor({
  item,
  allItems,
  onUpdate,
  onDelete,
  onSwitchItem,
  isSyncing
}: EditorProps) {
  // Local state for interactive editing to allow snappy inputs before debouncing / saving
  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary || "");
  const [problem, setProblem] = useState(item.problem || "");
  const [solution, setSolution] = useState(item.proposedSolution || "");
  const [uniqueInsight, setUniqueInsight] = useState(item.uniqueInsight || "");
  const [mvpText, setMvpText] = useState("");
  const [newDecisionTitle, setNewDecisionTitle] = useState("");
  const [newTimelineText, setNewTimelineText] = useState("");
  
  // Link item selector
  const [selectedLinkItemId, setSelectedLinkItemId] = useState("");

  // Editor tab state: 'canvas' (default editor) or 'moodboard'
  const [editorTab, setEditorTab] = useState<'canvas' | 'moodboard'>('canvas');

  // Sync state with item when item changes
  useEffect(() => {
    setTitle(item.title);
    setSummary(item.summary || "");
    setProblem(item.problem || "");
    setSolution(item.proposedSolution || "");
    setUniqueInsight(item.uniqueInsight || "");
    setSelectedLinkItemId("");
    setEditorTab('canvas');
  }, [item.id]);

  // Debounced/Triggered Updates
  const triggerUpdate = (fields: Partial<WorkspaceItem>) => {
    const updated = {
      ...item,
      ...fields,
      updatedAt: new Date().toISOString()
    };
    onUpdate(updated);
  };

  // Helper to handle MVP checkboxes
  const parseMvpItems = () => {
    if (!item.mvp) return [];
    return item.mvp.split("\n").filter(Boolean).map((line, idx) => {
      const isChecked = line.startsWith("[x] ");
      const text = line.replace(/^\[x\]\s|^\[\s\]\s/, "");
      return { id: idx, checked: isChecked, text };
    });
  };

  const handleToggleMvp = (index: number) => {
    const parsed = parseMvpItems();
    if (parsed[index]) {
      parsed[index].checked = !parsed[index].checked;
    }
    const serialized = parsed.map(p => `${p.checked ? "[x]" : "[ ]"} ${p.text}`).join("\n");
    triggerUpdate({ mvp: serialized });
  };

  const handleAddMvpItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mvpText.trim()) return;
    const currentMvp = item.mvp || "";
    const updatedMvp = currentMvp + (currentMvp ? "\n" : "") + `[ ] ${mvpText.trim()}`;
    triggerUpdate({ mvp: updatedMvp });
    setMvpText("");
  };

  const handleRemoveMvpItem = (index: number) => {
    const parsed = parseMvpItems();
    parsed.splice(index, 1);
    const serialized = parsed.map(p => `${p.checked ? "[x]" : "[ ]"} ${p.text}`).join("\n");
    triggerUpdate({ mvp: serialized });
  };

  // Decision Handlers
  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecisionTitle.trim()) return;
    const newDecision: DecisionEntry = {
      id: `dec-${Date.now()}`,
      status: "Pending",
      title: newDecisionTitle.trim(),
      content: "Awaiting research validation and testing metrics."
    };
    const updatedDecisions = [...(item.decisions || []), newDecision];
    triggerUpdate({ decisions: updatedDecisions });
    setNewDecisionTitle("");
  };

  const handleToggleDecisionStatus = (id: string) => {
    const updatedDecisions = (item.decisions || []).map(dec => {
      if (dec.id === id) {
        const nextStatus: Record<string, 'Decided' | 'Pending' | 'Rejected'> = {
          'Pending': 'Decided',
          'Decided': 'Rejected',
          'Rejected': 'Pending'
        };
        return { ...dec, status: nextStatus[dec.status] };
      }
      return dec;
    });
    triggerUpdate({ decisions: updatedDecisions });
  };

  // Timeline Log Handler
  const handleAddTimelineLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineText.trim()) return;
    const count = (item.timeline || []).length + 1;
    const newLog: TimelineEntry = {
      id: `time-${Date.now()}`,
      version: `v${count}.0 Custom`,
      title: newTimelineText.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase(),
      summary: "Manual log entry."
    };
    const updatedTimeline = [newLog, ...(item.timeline || [])];
    triggerUpdate({ timeline: updatedTimeline });
    setNewTimelineText("");
  };

  // Add Item Relations Link
  const handleLinkItem = () => {
    if (!selectedLinkItemId || (item.relatedIds || []).includes(selectedLinkItemId)) return;
    const updatedRelated = [...(item.relatedIds || []), selectedLinkItemId];
    triggerUpdate({ relatedIds: updatedRelated });
    
    // Auto sync backwards connection as well
    const targetItem = allItems.find(i => i.id === selectedLinkItemId);
    if (targetItem && !(targetItem.relatedIds || []).includes(item.id)) {
      const updatedTargetRelated = [...(targetItem.relatedIds || []), item.id];
      const updatedTarget = { ...targetItem, relatedIds: updatedTargetRelated };
      // Invoke parent to silently save the related link on both sides
      onUpdate(updatedTarget);
    }
    
    setSelectedLinkItemId("");
  };

  const handleUnlinkItem = (idToRemove: string) => {
    const updatedRelated = (item.relatedIds || []).filter(id => id !== idToRemove);
    triggerUpdate({ relatedIds: updatedRelated });
  };

  const parsedMvpList = parseMvpItems();
  const selectableLinkItems = allItems.filter(i => i.id !== item.id && !(item.relatedIds || []).includes(i.id));

  // Attachment callbacks
  const handleAttachmentAdded = (attachment: AttachmentEntry) => {
    const updated = { ...item, attachments: [...(item.attachments || []), attachment] };
    onUpdate(updated);
  };
  const handleAttachmentDeleted = (attachmentId: string) => {
    const updated = { ...item, attachments: (item.attachments || []).filter(a => a.id !== attachmentId) };
    onUpdate(updated);
  };
  const handleAttachmentNoteUpdated = (attachmentId: string, note: string) => {
    const updated = { ...item, attachments: (item.attachments || []).map(a => a.id === attachmentId ? { ...a, note } : a) };
    onUpdate(updated);
  };

  // Moodboard callbacks
  const handleMoodboardCardAdded = (card: MoodboardCard) => {
    const updated = { ...item, moodboard: [...(item.moodboard || []), card] };
    onUpdate(updated);
  };
  const handleMoodboardCardUpdated = (card: MoodboardCard) => {
    const updated = { ...item, moodboard: (item.moodboard || []).map(c => c.id === card.id ? card : c) };
    onUpdate(updated);
  };
  const handleMoodboardCardDeleted = (cardId: string) => {
    const updated = { ...item, moodboard: (item.moodboard || []).filter(c => c.id !== cardId) };
    onUpdate(updated);
  };

  return (
    <div className="max-w-[1150px] mx-auto select-text pb-24">

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-8 border-b border-outline-variant/20 pb-0">
        <button
          onClick={() => setEditorTab('canvas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 -mb-px ${
            editorTab === 'canvas'
              ? 'text-primary border-primary'
              : 'text-text-muted border-transparent hover:text-on-surface hover:border-outline-variant/40'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Canvas
        </button>
        <button
          onClick={() => setEditorTab('moodboard')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 -mb-px ${
            editorTab === 'moodboard'
              ? 'text-primary border-primary'
              : 'text-text-muted border-transparent hover:text-on-surface hover:border-outline-variant/40'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Moodboard
          {(item.moodboard || []).length > 0 && (
            <span className="text-[9px] font-mono text-text-muted bg-surface-container border border-outline-variant px-1.5 py-0.5 rounded">
              {(item.moodboard || []).length}
            </span>
          )}
        </button>
      </div>

      {/* Moodboard Tab */}
      {editorTab === 'moodboard' ? (
        <MoodboardView
          item={item}
          onCardAdded={handleMoodboardCardAdded}
          onCardUpdated={handleMoodboardCardUpdated}
          onCardDeleted={handleMoodboardCardDeleted}
        />
      ) : (

      /* Canvas Tab — original editor layout */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-0">
      
      {/* Left Columns (Active Workspace Thought Canvas) */}
      <div className="lg:col-span-8 space-y-12">
        
        {/* Title */}
        <section className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => triggerUpdate({ title })}
            className="w-full bg-transparent border-none text-on-surface font-display text-3xl md:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight focus:text-primary outline-none py-1.5 border-b border-transparent focus:border-outline-variant transition-all placeholder-on-surface-variant/30"
            placeholder="Autonomous Neural Mesh..."
          />
          <div className="flex items-center gap-3 text-[10px] font-mono tracking-widest text-text-muted uppercase mt-3">
            <span>The Core Premise</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span className="text-text-muted italic text-xs lowercase leading-none">
              (click text to edit, changes auto-sync)
            </span>
          </div>
        </section>

        {/* One Sentence Summary */}
        <section className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
          <div className="text-[10px] font-mono tracking-widest text-on-surface uppercase mb-2.5 font-bold">One-Sentence Summary</div>
          <textarea
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onBlur={() => triggerUpdate({ summary })}
            rows={1}
            className="w-full bg-transparent border-none text-on-surface text-sm md:text-base outline-none font-medium placeholder-on-surface-variant/30 leading-relaxed resize-none overflow-hidden"
            placeholder="Describe what this is in a single elegant, high-impact sentence..."
          />
        </section>

        {/* Problem */}
        <section className="space-y-4">
          <h3 className="font-mono text-xs text-on-surface tracking-widest uppercase border-b border-outline-variant pb-2.5 w-fit font-bold">The Problem</h3>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            onBlur={() => triggerUpdate({ problem })}
            rows={4}
            className="w-full bg-transparent border-none text-on-surface/90 text-sm md:text-base leading-relaxed outline-none resize-none placeholder-on-surface-variant/30"
            placeholder="What friction exists in the status quo? Why does this matter? Detail the core user trauma..."
          />
        </section>

        {/* Solution */}
        <section className="space-y-4">
          <h3 className="font-mono text-xs text-on-surface tracking-widest uppercase border-b border-outline-variant pb-2.5 w-fit font-bold">The Solution</h3>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            onBlur={() => triggerUpdate({ proposedSolution: solution })}
            rows={4}
            className="w-full bg-transparent border-none text-on-surface/90 text-sm md:text-base leading-relaxed outline-none resize-none placeholder-on-surface-variant/30"
            placeholder="How does your protocol or product solve this? Keep it technical, elegant, and definitive..."
          />
        </section>

        {/* Unique Insight - Tactile styled glass box */}
        <section className="p-7 bg-surface-container-low rounded-xl relative overflow-hidden group border border-outline-variant shadow-lg">
          <div className="absolute top-0 right-0 p-5 opacity-35">
            <Sparkles className="w-5 h-5 text-on-surface" />
          </div>
          <h3 className="font-mono text-[10px] text-text-muted mb-3.5 uppercase tracking-widest font-bold">Unique Insight</h3>
          <textarea
            value={uniqueInsight}
            onChange={(e) => setUniqueInsight(e.target.value)}
            onBlur={() => triggerUpdate({ uniqueInsight })}
            rows={4}
            className="w-full bg-transparent border-none text-on-surface text-base md:text-lg font-light italic leading-relaxed outline-none resize-none placeholder-on-surface-variant/30"
            placeholder="What secret do you know that competitors ignore? Hardware isn't the bottleneck..."
          />
        </section>

        {/* MVP Requirements Checklist */}
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
            <h3 className="font-mono text-xs text-on-surface tracking-widest uppercase w-fit font-bold">MVP Requirements</h3>
            <span className="font-mono text-[10px] text-text-muted uppercase">
              {parsedMvpList.filter(p => p.checked).length} / {parsedMvpList.length} Complete
            </span>
          </div>
          
          {parsedMvpList.length > 0 ? (
            <ul className="space-y-3.5">
              {parsedMvpList.map((mvpItem, index) => (
                <li key={mvpItem.id} className="flex gap-4 items-center group">
                  <button 
                    onClick={() => handleToggleMvp(index)}
                    className="text-on-surface hover:scale-105 transition-all flex-shrink-0 cursor-pointer"
                  >
                    {mvpItem.checked ? (
                      <CheckCircle2 className="w-5 h-5 text-on-surface" />
                    ) : (
                      <Circle className="w-5 h-5 text-outline" />
                    )}
                  </button>
                  <span className={`flex-1 text-xs md:text-sm text-on-surface/80 group-hover:text-on-surface transition-colors leading-relaxed ${mvpItem.checked ? "line-through text-text-muted/55" : ""}`}>
                    {mvpItem.text}
                  </span>
                  <button 
                    onClick={() => handleRemoveMvpItem(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted italic py-2">No MVP requirements specified. Add one below or click EXPAND on Co-Pilot to generate them.</p>
          )}

          {/* New MVP Add Form */}
          <form onSubmit={handleAddMvpItem} className="flex items-center gap-3 max-w-lg pt-2">
            <input
              type="text"
              value={mvpText}
              onChange={(e) => setMvpText(e.target.value)}
              placeholder="Add zero-config discovery protocol..."
              className="flex-1 bg-surface-container-lowest border border-outline-variant focus:border-primary/50 text-sm px-4 py-2.5 rounded-lg outline-none text-on-surface placeholder-on-surface-variant/40"
            />
            <button 
              type="submit"
              className="px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          </form>
        </section>

        {/* Structured Questions Expansion Accordion */}
        <section className="space-y-6 pt-6 border-t border-outline-variant">
          <h4 className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-bold">Supplemental Architecture & Strategy</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold">Target Audience</label>
              <textarea
                value={item.targetAudience || ""}
                onChange={(e) => triggerUpdate({ targetAudience: e.target.value })}
                rows={3}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 resize-none transition-colors"
                placeholder="IoT developers, systems researchers..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold">Validation Hypothesis</label>
              <textarea
                value={item.validationHypothesis || ""}
                onChange={(e) => triggerUpdate({ validationHypothesis: e.target.value })}
                rows={3}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 resize-none transition-colors"
                placeholder="By clustering Raspberry Pis..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold">Business Model & Commissions</label>
              <textarea
                value={item.businessModel || ""}
                onChange={(e) => triggerUpdate({ businessModel: e.target.value })}
                rows={3}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 resize-none transition-colors"
                placeholder="Network commission on computational leases..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-semibold">Technical Challenges & Vulnerabilities</label>
              <textarea
                value={item.technicalChallenges || ""}
                onChange={(e) => triggerUpdate({ technicalChallenges: e.target.value })}
                rows={3}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 resize-none transition-colors"
                placeholder="Sandboxing multi-tenant WASM execution..."
              />
            </div>
          </div>
        </section>

      </div>

      {/* Right Column (Product metadata side-rail panel) */}
      <aside className="lg:col-span-4 space-y-6">
        
        {/* Meta Parameters Panel */}
        <div className="bg-surface-container-low p-6 rounded-xl space-y-5 border border-outline-variant shadow-lg">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
            <h4 className="font-mono text-[10px] text-on-surface uppercase tracking-widest font-bold">Thought Parameters</h4>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => triggerUpdate({ pinned: !item.pinned })}
                className={`p-1.5 rounded transition-colors cursor-pointer ${item.pinned ? "text-primary bg-primary/10" : "text-text-muted hover:text-on-surface"}`}
                title={item.pinned ? "Unpin thought" : "Pin thought"}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Delete thought"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 font-mono text-[11px]">
            {/* Type Selector */}
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-text-muted uppercase">WORKSPACE TYPE</span>
              <select
                value={item.type}
                onChange={(e) => triggerUpdate({ type: e.target.value as any })}
                className="bg-transparent border-none text-right text-on-surface focus:text-text-muted outline-none font-semibold uppercase cursor-pointer"
              >
                <option value="Idea" className="bg-surface text-on-surface text-xs text-left">IDEA</option>
                <option value="Research" className="bg-surface text-on-surface text-xs text-left">RESEARCH</option>
                <option value="PRD" className="bg-surface text-on-surface text-xs text-left">PRD</option>
                <option value="Architecture" className="bg-surface text-on-surface text-xs text-left">ARCHITECTURE</option>
                <option value="Experiment" className="bg-surface text-on-surface text-xs text-left">EXPERIMENT</option>
                <option value="Task" className="bg-surface text-on-surface text-xs text-left">TASK</option>
                <option value="Launch" className="bg-surface text-on-surface text-xs text-left">LAUNCH</option>
              </select>
            </div>

            {/* Lifecycle Status Selector */}
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-text-muted uppercase">LIFECYCLE STATUS</span>
              <select
                value={item.status}
                onChange={(e) => triggerUpdate({ status: e.target.value as any })}
                className="bg-transparent border-none text-right text-on-surface focus:text-text-muted outline-none font-semibold uppercase cursor-pointer"
              >
                <option value="Captured" className="bg-surface text-on-surface text-xs text-left">CAPTURED</option>
                <option value="Expanded" className="bg-surface text-on-surface text-xs text-left">EXPANDED</option>
                <option value="Validated" className="bg-surface text-on-surface text-xs text-left">VALIDATED</option>
                <option value="Planning" className="bg-surface text-on-surface text-xs text-left">PLANNING</option>
                <option value="Building" className="bg-surface text-on-surface text-xs text-left">BUILDING</option>
                <option value="Released" className="bg-surface text-on-surface text-xs text-left">RELEASED</option>
                <option value="Archived" className="bg-surface text-on-surface text-xs text-left">ARCHIVED</option>
              </select>
            </div>

            {/* Provenance Date */}
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-text-muted uppercase">PROVENANCE</span>
              <input
                type="text"
                value={item.provenance}
                onChange={(e) => triggerUpdate({ provenance: e.target.value })}
                className="bg-transparent border-none text-right text-on-surface outline-none w-28 placeholder-on-surface-variant/30 font-semibold"
                placeholder="OCT 12, 2023"
              />
            </div>

            {/* Source */}
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-text-muted uppercase">SOURCE</span>
              <input
                type="text"
                value={item.source}
                onChange={(e) => triggerUpdate({ source: e.target.value })}
                className="bg-transparent border-none text-right text-on-surface uppercase outline-none w-28 placeholder-on-surface-variant/30 font-semibold"
                placeholder="WHITEBOARD"
              />
            </div>

            {/* Collection folder */}
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-text-muted uppercase">COLLECTION</span>
              <input
                type="text"
                value={item.collection}
                onChange={(e) => triggerUpdate({ collection: e.target.value })}
                className="bg-transparent border-none text-right text-on-surface outline-none w-28 placeholder-on-surface-variant/30 font-semibold"
                placeholder="AI, Business..."
              />
            </div>

            {/* Interest Score */}
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-text-muted uppercase">INTEREST LEVEL</span>
              <input
                type="text"
                value={item.interestLevel || ""}
                onChange={(e) => triggerUpdate({ interestLevel: e.target.value })}
                className="bg-transparent border-none text-right text-on-surface outline-none w-16 placeholder-on-surface-variant/30 font-semibold"
                placeholder="9/10"
              />
            </div>

            {/* Confidence Gauge */}
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-text-muted uppercase">CONFIDENCE GAUGE</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={item.confidence ? parseInt(item.confidence.replace("%", "")) || 50 : 50}
                  onChange={(e) => triggerUpdate({ confidence: `${e.target.value}%` })}
                  className="w-16 accent-primary cursor-pointer bg-outline-variant"
                />
                <span className="text-on-surface font-bold w-8 text-right">{item.confidence || "50%"}</span>
              </div>
            </div>

            {/* Complexity Difficulty */}
            <div className="flex justify-between items-center pb-1">
              <span className="text-text-muted uppercase">COMPLEXITY</span>
              <select
                value={item.difficulty}
                onChange={(e) => triggerUpdate({ difficulty: e.target.value as any })}
                className="bg-transparent border-none text-right text-on-surface focus:text-text-muted outline-none font-semibold cursor-pointer"
              >
                <option value="Easy" className="bg-surface text-on-surface text-xs text-left">EASY</option>
                <option value="Medium" className="bg-surface text-on-surface text-xs text-left">MEDIUM</option>
                <option value="Hard" className="bg-surface text-on-surface text-xs text-left">HARD</option>
              </select>
            </div>
          </div>

          {/* Tags list */}
          <div className="pt-4 border-t border-outline-variant">
            <p className="text-[9px] font-mono text-text-muted uppercase mb-2 font-bold">TAG CLOUD</p>
            <div className="flex flex-wrap gap-1.5">
              {(item.tags || []).map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-0.5 bg-surface-container border border-outline-variant rounded font-mono text-[9px] text-on-surface uppercase flex items-center gap-1 font-medium"
                >
                  <span>{tag}</span>
                  <button 
                    onClick={() => {
                      const updatedTags = item.tags.filter(t => t !== tag);
                      triggerUpdate({ tags: updatedTags });
                    }}
                    className="hover:text-red-500 text-text-muted font-bold leading-none text-[8px] cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
              {/* Simple Input to Add Tag */}
              <input
                type="text"
                placeholder="+ tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim().toUpperCase();
                    if (val && !(item.tags || []).includes(val)) {
                      triggerUpdate({ tags: [...(item.tags || []), val] });
                      e.currentTarget.value = "";
                    }
                  }
                }}
                className="bg-transparent border-none text-[9px] font-mono outline-none w-12 text-on-surface uppercase placeholder-on-surface-variant/40"
              />
            </div>
          </div>
          
          {/* explicit action buttons */}
          <div className="pt-3 border-t border-outline-variant flex flex-col gap-2">
            <button 
              onClick={() => triggerUpdate({ status: "Archived" })}
              disabled={item.status === "Archived"}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                item.status === "Archived"
                  ? "bg-surface-container border border-outline-variant text-text-muted/50 cursor-not-allowed"
                  : "bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface"
              }`}
            >
              <span>MOVE TO ARCHIVE</span>
            </button>
            
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to permanently delete this thought?")) {
                  onDelete(item.id);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-600 text-red-500 hover:text-white rounded-lg text-xs font-mono font-bold tracking-wider transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>PERMANENTLY DELETE</span>
            </button>
          </div>
        </div>

        {/* Multi-Item Relationships Box */}
        <div className="bg-surface-container-low p-6 rounded-xl space-y-4 border border-outline-variant shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-outline-variant pb-2.5">
            <LinkIcon className="w-3.5 h-3.5 text-on-surface" />
            <h4 className="font-mono text-[10px] text-on-surface uppercase tracking-widest font-bold">Linked Relations</h4>
          </div>
          
          <div className="space-y-3">
            {(item.relatedIds || []).length > 0 ? (
              <div className="space-y-3">
                {(item.relatedIds || []).map(relatedId => {
                  const relItem = allItems.find(i => i.id === relatedId);
                  if (!relItem) return null;
                  return (
                    <div key={relatedId} className="flex items-center justify-between group">
                      <button
                        onClick={() => onSwitchItem(relatedId)}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <p className="text-[12px] font-semibold text-on-surface hover:text-primary transition-colors truncate">
                          {relItem.title}
                        </p>
                        <p className="text-[9px] font-mono text-text-muted uppercase">
                          {relItem.type} • {relItem.status}
                        </p>
                      </button>
                      <button
                        onClick={() => handleUnlinkItem(relatedId)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 transition-all cursor-pointer"
                        title="Unlink"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No items currently linked.</p>
            )}

            {/* Dropdown Link Selection */}
            {selectableLinkItems.length > 0 && (
              <div className="flex gap-1.5 pt-3 border-t border-outline-variant">
                <select
                  value={selectedLinkItemId}
                  onChange={(e) => setSelectedLinkItemId(e.target.value)}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-xs text-on-surface outline-none"
                >
                  <option value="">-- Link workspace item --</option>
                  {selectableLinkItems.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.type.toUpperCase()}: {opt.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLinkItem}
                  disabled={!selectedLinkItemId}
                  className="px-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded text-on-surface text-xs font-mono transition-all disabled:opacity-50 cursor-pointer"
                >
                  LINK
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Decisions Log Panel */}
        <div className="bg-surface-container-low p-6 rounded-xl border-l-2 border-primary space-y-4 border border-outline-variant shadow-lg">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
            <div className="flex items-center gap-1.5">
              <Gavel className="w-3.5 h-3.5 text-on-surface" />
              <h4 className="font-mono text-[10px] text-on-surface uppercase tracking-widest font-bold">Decision Board</h4>
            </div>
            <span className="font-mono text-[9px] text-text-muted">
              {(item.decisions || []).length} Logs
            </span>
          </div>

          <div className="space-y-4">
            {(item.decisions || []).map(dec => {
              const statusColors = {
                Decided: "text-on-surface bg-surface-container border-outline-variant",
                Pending: "text-text-muted bg-surface-container-low border-outline-variant",
                Rejected: "text-red-400 bg-red-950/10 border-red-900/30"
              };
              return (
                <div key={dec.id} className="space-y-1 group">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => handleToggleDecisionStatus(dec.id)}
                      className="flex items-center gap-2 text-left cursor-pointer"
                      title="Toggle Status (Decided/Pending/Rejected)"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dec.status === 'Decided' ? 'bg-primary' : dec.status === 'Pending' ? 'bg-neutral-500' : 'bg-red-500'}`}></span>
                      <p className={`text-[9px] font-mono font-bold uppercase ${statusColors[dec.status] || "text-text-muted"}`}>
                        {dec.status}
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        const updated = (item.decisions || []).filter(d => d.id !== dec.id);
                        triggerUpdate({ decisions: updated });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 text-[10px] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-[12px] font-bold text-on-surface leading-tight">{dec.title}</p>
                  <p className="text-[11px] leading-snug text-text-muted">{dec.content}</p>
                </div>
              );
            })}
          </div>

          {/* Quick Add Decision */}
          <form onSubmit={handleAddDecision} className="flex gap-2 pt-2 border-t border-outline-variant">
            <input
              type="text"
              value={newDecisionTitle}
              onChange={(e) => setNewDecisionTitle(e.target.value)}
              placeholder="e.g. Use WASM core..."
              className="flex-1 bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              className="px-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded hover:text-primary text-xs font-mono cursor-pointer"
            >
              +
            </button>
          </form>
        </div>

        {/* Version Timeline Panel */}
        <div className="bg-surface-container-low p-6 rounded-xl space-y-4 border border-outline-variant shadow-lg">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-on-surface" />
              <h4 className="font-mono text-[10px] text-on-surface uppercase tracking-widest font-bold">Audit Timeline</h4>
            </div>
            <span className="font-mono text-[9px] text-text-muted">
              {(item.timeline || []).length} Revisions
            </span>
          </div>

          <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-[3px] before:top-2 before:bottom-0 before:w-px before:bg-outline-variant">
            {(item.timeline || []).map((t, idx) => (
              <div key={t.id} className="relative group">
                {/* Timeline node */}
                <div className={`absolute -left-[16px] top-1.5 w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-primary ring-2 ring-primary/20 shadow-[0_0_8px_var(--outline-color)]' : 'bg-outline-variant'}`}></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono text-text-muted uppercase font-semibold">{t.version}</p>
                  <p className="text-[9px] font-mono text-text-muted">{t.date}</p>
                </div>
                <p className="text-xs font-semibold text-on-surface mt-0.5">{t.title}</p>
                {t.summary && <p className="text-[11px] text-text-muted leading-snug">{t.summary}</p>}
              </div>
            ))}
          </div>

          {/* Quick Add Timeline log */}
          <form onSubmit={handleAddTimelineLog} className="flex gap-2 pt-2 border-t border-outline-variant">
            <input
              type="text"
              value={newTimelineText}
              onChange={(e) => setNewTimelineText(e.target.value)}
              placeholder="Record architectural shift..."
              className="flex-1 bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              className="px-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded hover:text-primary text-xs font-mono cursor-pointer"
            >
              +
            </button>
          </form>
        </div>

        {/* Attachments Panel */}
        <AttachmentsPanel
          item={item}
          onAttachmentAdded={handleAttachmentAdded}
          onAttachmentDeleted={handleAttachmentDeleted}
          onAttachmentNoteUpdated={handleAttachmentNoteUpdated}
        />

      </aside>
    </div>
    )}
    </div>
  );
}
