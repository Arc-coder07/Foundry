import React, { useState, useRef } from "react";
import {
  FileText,
  FileUp,
  Trash2,
  MessageSquare,
  Eye,
  X,
  Upload,
  File
} from "lucide-react";
import { WorkspaceItem, AttachmentEntry } from "../types";
import { Markdown } from "./Markdown";

interface AttachmentsPanelProps {
  item: WorkspaceItem;
  onAttachmentAdded: (attachment: AttachmentEntry) => void;
  onAttachmentDeleted: (attachmentId: string) => void;
  onAttachmentNoteUpdated: (attachmentId: string, note: string) => void;
}

export function AttachmentsPanel({
  item,
  onAttachmentAdded,
  onAttachmentDeleted,
  onAttachmentNoteUpdated
}: AttachmentsPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<AttachmentEntry | null>(null);
  const [viewContent, setViewContent] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = item.attachments || [];

  const handleUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['md', 'pdf'].includes(ext)) {
      alert('Only .md and .pdf files are supported.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/items/${item.id}/attachments`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const attachment: AttachmentEntry = await res.json();
        onAttachmentAdded(attachment);
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      const res = await fetch(`/api/items/${item.id}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onAttachmentDeleted(attachmentId);
        if (viewingAttachment?.id === attachmentId) {
          setViewingAttachment(null);
          setViewContent(null);
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleView = async (attachment: AttachmentEntry) => {
    setViewingAttachment(attachment);
    if (attachment.type === 'md') {
      try {
        const res = await fetch(`/api/attachments/${item.id}/${attachment.filename}`);
        const text = await res.text();
        setViewContent(text);
      } catch {
        setViewContent('Failed to load file.');
      }
    } else {
      setViewContent(null);
    }
  };

  const handleNoteSave = async (attachmentId: string) => {
    try {
      await fetch(`/api/items/${item.id}/attachments/${attachmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText })
      });
      onAttachmentNoteUpdated(attachmentId, noteText);
    } catch (err) {
      console.error('Note save failed:', err);
    }
    setEditingNoteId(null);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <>
      <div className="bg-surface-container-low p-6 rounded-xl space-y-4 border border-outline-variant shadow-lg">
        <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-on-surface" />
            <h4 className="font-mono text-[10px] text-on-surface uppercase tracking-widest font-bold">Attachments</h4>
          </div>
          <span className="font-mono text-[9px] text-text-muted">
            {attachments.length} File{attachments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* File List */}
        <div className="space-y-3">
          {attachments.length > 0 ? (
            attachments.map(att => (
              <div key={att.id} className="group space-y-1.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleView(att)}
                    className="flex items-center gap-2 text-left flex-1 cursor-pointer min-w-0"
                  >
                    <span className="flex-shrink-0">
                      {att.type === 'md' ? (
                        <FileText className="w-4 h-4 text-blue-400" />
                      ) : (
                        <File className="w-4 h-4 text-red-400" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-on-surface hover:text-primary transition-colors truncate">
                        {att.originalName}
                      </p>
                      <p className="text-[9px] font-mono text-text-muted uppercase">
                        {att.type.toUpperCase()} • {new Date(att.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingNoteId(att.id);
                        setNoteText(att.note || '');
                      }}
                      className="p-1 text-text-muted hover:text-primary transition-colors cursor-pointer"
                      title="Add note"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleView(att)}
                      className="p-1 text-text-muted hover:text-primary transition-colors cursor-pointer"
                      title="View file"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(att.id)}
                      className="p-1 text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* Note display */}
                {att.note && editingNoteId !== att.id && (
                  <p className="text-[10px] text-text-muted italic pl-6 leading-snug">
                    📝 {att.note}
                  </p>
                )}

                {/* Note editor */}
                {editingNoteId === att.id && (
                  <div className="pl-6 flex gap-1.5">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNoteSave(att.id); }}
                      placeholder="Add a note about this file..."
                      className="flex-1 bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-[10px] text-on-surface outline-none focus:border-primary/50"
                      autoFocus
                    />
                    <button
                      onClick={() => handleNoteSave(att.id)}
                      className="px-2 bg-primary/10 text-primary rounded text-[9px] font-mono font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="px-1.5 text-text-muted hover:text-on-surface transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-text-muted italic py-1">No files attached. Drop or upload .md / .pdf files below.</p>
          )}
        </div>

        {/* Drop Zone / Upload */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`attachment-dropzone border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-[10px] font-mono text-text-muted uppercase">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Upload className="w-4 h-4 text-text-muted" />
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                {isDragging ? 'Drop to attach' : 'Upload .md / .pdf'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => { setViewingAttachment(null); setViewContent(null); }}>
          <div
            className="bg-surface-container rounded-xl border border-outline-variant shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <div className="flex items-center gap-2 min-w-0">
                {viewingAttachment.type === 'md' ? (
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                ) : (
                  <File className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <h3 className="text-sm font-semibold text-on-surface truncate">{viewingAttachment.originalName}</h3>
                <span className="text-[9px] font-mono text-text-muted uppercase px-1.5 py-0.5 bg-surface-container-high rounded flex-shrink-0">
                  {viewingAttachment.type}
                </span>
              </div>
              <button
                onClick={() => { setViewingAttachment(null); setViewContent(null); }}
                className="p-1.5 rounded hover:bg-surface-container-high text-text-muted hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-auto p-6">
              {viewingAttachment.type === 'md' && viewContent !== null ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <Markdown content={viewContent} />
                </div>
              ) : viewingAttachment.type === 'pdf' ? (
                <iframe
                  src={`/api/attachments/${item.id}/${viewingAttachment.filename}`}
                  className="w-full h-full min-h-[60vh] rounded border border-outline-variant/20"
                  title={viewingAttachment.originalName}
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-text-muted text-sm">
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
