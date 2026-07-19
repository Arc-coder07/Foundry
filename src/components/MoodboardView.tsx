import React, { useState, useRef } from "react";
import {
  Plus,
  Image as ImageIcon,
  StickyNote,
  Link2,
  Trash2,
  X,
  ExternalLink,
  Upload,
  Type,
  Globe
} from "lucide-react";
import { WorkspaceItem, MoodboardCard } from "../types";

interface MoodboardViewProps {
  item: WorkspaceItem;
  onCardAdded: (card: MoodboardCard) => void;
  onCardUpdated: (card: MoodboardCard) => void;
  onCardDeleted: (cardId: string) => void;
}

export function MoodboardView({
  item,
  onCardAdded,
  onCardUpdated,
  onCardDeleted
}: MoodboardViewProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMode, setAddMode] = useState<'image' | 'note' | 'link' | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteCaption, setNoteCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkCaption, setLinkCaption] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const cards = item.moodboard || [];

  const handleAddImage = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'image');
      formData.append('caption', imageCaption);

      const res = await fetch(`/api/items/${item.id}/moodboard`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const card: MoodboardCard = await res.json();
        onCardAdded(card);
        setImageCaption("");
        setAddMode(null);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const formData = new FormData();
      formData.append('type', 'note');
      formData.append('content', noteContent);
      formData.append('caption', noteCaption);

      const res = await fetch(`/api/items/${item.id}/moodboard`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const card: MoodboardCard = await res.json();
        onCardAdded(card);
        setNoteContent("");
        setNoteCaption("");
        setAddMode(null);
      }
    } catch (err) {
      console.error('Note add failed:', err);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;
    try {
      const formData = new FormData();
      formData.append('type', 'link');
      formData.append('content', linkUrl);
      formData.append('url', linkUrl);
      formData.append('caption', linkCaption);

      const res = await fetch(`/api/items/${item.id}/moodboard`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const card: MoodboardCard = await res.json();
        onCardAdded(card);
        setLinkUrl("");
        setLinkCaption("");
        setAddMode(null);
      }
    } catch (err) {
      console.error('Link add failed:', err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/items/${item.id}/moodboard/${cardId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onCardDeleted(cardId);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleUpdateCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/items/${item.id}/moodboard/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, caption: editCaption })
      });
      if (res.ok) {
        const updated: MoodboardCard = await res.json();
        onCardUpdated(updated);
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
    setEditingCardId(null);
  };

  const startEditing = (card: MoodboardCard) => {
    setEditingCardId(card.id);
    setEditContent(card.content);
    setEditCaption(card.caption);
  };

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Moodboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-xs text-on-surface tracking-widest uppercase font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Moodboard / Inspiration Canvas
          </h2>
          <p className="text-[10px] text-text-muted font-mono mt-1 uppercase">
            {cards.length} card{cards.length !== 1 ? 's' : ''} • Collect references, ideas & visual inspiration
          </p>
        </div>

        {/* Add Card Button */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-on-primary rounded text-[10px] font-mono font-bold tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            ADD CARD
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 bg-surface-container-low border border-outline-variant rounded-lg shadow-xl z-50 p-1.5 w-44">
              <p className="text-[9px] font-mono text-text-muted px-2.5 py-1.5 uppercase tracking-widest">Card Type</p>
              <button
                onClick={() => { setAddMode('image'); setShowAddMenu(false); }}
                className="w-full text-left px-2.5 py-2 text-xs text-text-muted hover:text-on-surface hover:bg-surface-container rounded-md transition-colors cursor-pointer font-medium flex items-center gap-2"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Image
              </button>
              <button
                onClick={() => { setAddMode('note'); setShowAddMenu(false); }}
                className="w-full text-left px-2.5 py-2 text-xs text-text-muted hover:text-on-surface hover:bg-surface-container rounded-md transition-colors cursor-pointer font-medium flex items-center gap-2"
              >
                <StickyNote className="w-3.5 h-3.5" /> Note
              </button>
              <button
                onClick={() => { setAddMode('link'); setShowAddMenu(false); }}
                className="w-full text-left px-2.5 py-2 text-xs text-text-muted hover:text-on-surface hover:bg-surface-container rounded-md transition-colors cursor-pointer font-medium flex items-center gap-2"
              >
                <Link2 className="w-3.5 h-3.5" /> Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Card Forms */}
      {addMode && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-[10px] text-on-surface uppercase tracking-widest font-bold flex items-center gap-2">
              {addMode === 'image' && <><ImageIcon className="w-3.5 h-3.5 text-primary" /> Add Image Card</>}
              {addMode === 'note' && <><Type className="w-3.5 h-3.5 text-primary" /> Add Note Card</>}
              {addMode === 'link' && <><Globe className="w-3.5 h-3.5 text-primary" /> Add Link Card</>}
            </h4>
            <button
              onClick={() => setAddMode(null)}
              className="p-1 text-text-muted hover:text-on-surface transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {addMode === 'image' && (
            <div className="space-y-3">
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-outline-variant/40 hover:border-primary/40 rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-surface-container"
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAddImage(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-xs font-mono text-text-muted">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-text-muted" />
                    <span className="text-xs font-mono text-text-muted uppercase">Click to upload image</span>
                    <span className="text-[9px] text-text-muted/60">.png, .jpg, .gif, .webp, .svg</span>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
              />
            </div>
          )}

          {addMode === 'note' && (
            <div className="space-y-3">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                placeholder="Brainstorm fragment, quote, or quick thought..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:border-primary/50 resize-none placeholder-on-surface-variant/40"
                autoFocus
              />
              <input
                type="text"
                value={noteCaption}
                onChange={(e) => setNoteCaption(e.target.value)}
                placeholder="Label (optional)"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteContent.trim()}
                className="px-4 py-2 bg-primary text-on-primary rounded text-[10px] font-mono font-bold tracking-wider hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer"
              >
                ADD NOTE
              </button>
            </div>
          )}

          {addMode === 'link' && (
            <div className="space-y-3">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
                autoFocus
              />
              <input
                type="text"
                value={linkCaption}
                onChange={(e) => setLinkCaption(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
              />
              <button
                onClick={handleAddLink}
                disabled={!linkUrl.trim()}
                className="px-4 py-2 bg-primary text-on-primary rounded text-[10px] font-mono font-bold tracking-wider hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer"
              >
                ADD LINK
              </button>
            </div>
          )}
        </div>
      )}

      {/* Masonry Grid of Cards */}
      {cards.length > 0 ? (
        <div className="moodboard-grid">
          {cards.map(card => (
            <div key={card.id} className="moodboard-card group">
              {/* Delete button */}
              <button
                onClick={() => handleDeleteCard(card.id)}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 text-white/70 hover:text-red-400 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer"
                title="Remove card"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              {/* IMAGE CARD */}
              {card.type === 'image' && card.imageFilename && (
                <div className="moodboard-card-image">
                  <img
                    src={`/api/moodboard/${item.id}/${card.imageFilename}`}
                    alt={card.caption || 'Moodboard image'}
                    className="w-full h-auto object-cover rounded-lg"
                    loading="lazy"
                  />
                  {card.caption && (
                    <p className="text-[10px] text-text-muted mt-2 px-1 leading-snug">{card.caption}</p>
                  )}
                </div>
              )}

              {/* NOTE CARD */}
              {card.type === 'note' && (
                <div
                  className="moodboard-card-note"
                  onDoubleClick={() => startEditing(card)}
                >
                  <StickyNote className="w-3.5 h-3.5 text-primary/50 mb-2 flex-shrink-0" />
                  {editingCardId === card.id ? (
                    <div className="space-y-2 w-full">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-xs text-on-surface outline-none focus:border-primary/50 resize-none"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Label..."
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-[10px] text-on-surface outline-none focus:border-primary/50"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateCard(card.id)}
                          className="px-2.5 py-1 bg-primary text-on-primary rounded text-[9px] font-mono font-bold cursor-pointer"
                        >
                          SAVE
                        </button>
                        <button
                          onClick={() => setEditingCardId(null)}
                          className="px-2 py-1 text-text-muted hover:text-on-surface text-[9px] font-mono cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-on-surface/90 leading-relaxed whitespace-pre-wrap">{card.content}</p>
                      {card.caption && (
                        <p className="text-[9px] font-mono text-text-muted uppercase mt-2 tracking-wider">— {card.caption}</p>
                      )}
                      <p className="text-[8px] text-text-muted/50 mt-1.5 font-mono">Double-click to edit</p>
                    </>
                  )}
                </div>
              )}

              {/* LINK CARD */}
              {card.type === 'link' && (
                <div className="moodboard-card-link">
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={card.url || card.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-on-surface hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <span className="truncate">{card.caption || getDomain(card.url || card.content)}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                      <p className="text-[9px] text-text-muted font-mono truncate mt-0.5">
                        {getDomain(card.url || card.content)}
                      </p>
                    </div>
                  </div>
                  {card.caption && card.caption !== getDomain(card.url || card.content) && (
                    <p className="text-[10px] text-text-muted mt-2 leading-snug">{card.caption}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 border-2 border-dashed border-outline-variant/20 rounded-xl text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-xl bg-surface-container-high/50 border border-outline-variant/20 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-text-muted/40" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider">Empty canvas</h3>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed max-w-xs mx-auto">
              Start collecting inspiration — add images, quick notes, or save reference links to build your vision.
            </p>
          </div>
          <button
            onClick={() => { setShowAddMenu(false); setAddMode('note'); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-on-primary rounded text-[10px] font-mono font-bold tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            ADD FIRST CARD
          </button>
        </div>
      )}
    </div>
  );
}
