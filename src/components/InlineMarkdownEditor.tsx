import React, { useState } from 'react';
import { Eye, Edit3 } from 'lucide-react';
import { Markdown } from './Markdown';

interface InlineMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
}

const InlineMarkdownEditor: React.FC<InlineMarkdownEditorProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  minRows = 4,
  className = ""
}) => {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="relative group flex flex-col w-full">
      <div className="absolute -top-7 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[10px] font-mono uppercase text-text-muted transition-colors"
          title={isPreview ? "Edit text" : "Preview markdown"}
        >
          {isPreview ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {isPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {isPreview ? (
        <div className={`min-h-[6rem] p-3 rounded border border-outline-variant cursor-text bg-surface-container-lowest/30 overflow-y-auto prose prose-invert prose-sm ${className}`} onClick={() => setIsPreview(false)}>
          {value.trim() ? (
            <Markdown content={value} />
          ) : (
            <p className="text-on-surface-variant/40 italic text-sm m-0">{placeholder || "No content provided."}</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={minRows}
          className={`w-full bg-transparent border-none text-on-surface/90 text-sm md:text-base leading-relaxed outline-none resize-y placeholder-on-surface-variant/30 ${className}`}
          placeholder={placeholder}
        />
      )}
      
      {/* Live character count for large text areas */}
      <div className="absolute -bottom-6 right-0 text-[10px] font-mono text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
        {value.length} chars | {value.split(/\s+/).filter(Boolean).length} words
      </div>
    </div>
  );
};

export default InlineMarkdownEditor;
