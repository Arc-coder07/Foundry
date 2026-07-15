import React from "react";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  // Split content by lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let currentListType: "bullet" | "number" | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      if (currentListType === "bullet") {
        elements.push(
          <ul key={`list-${key}`} className="list-disc pl-6 space-y-2 mb-4 text-on-surface/85">
            {...currentList}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${key}`} className="list-decimal pl-6 space-y-2 mb-4 text-on-surface/85">
            {...currentList}
          </ol>
        );
      }
      currentList = [];
      currentListType = null;
    }
  };

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Basic bold **text** and code `code` parsing
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-on-surface">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="bg-surface-container border border-outline-variant text-on-surface px-1.5 py-0.5 rounded font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={`code-${i}`} className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg font-mono text-xs text-text-muted overflow-x-auto my-4 max-w-full">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushList(`flush-${i}`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Handle Headers
    if (line.startsWith("### ")) {
      flushList(`flush-${i}`);
      elements.push(
        <h3 key={i} className="text-base font-medium text-on-surface mt-6 mb-3 font-mono tracking-tight flex items-center gap-2 border-b border-outline-variant pb-1">
          {parseInlineStyles(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList(`flush-${i}`);
      elements.push(
        <h2 key={i} className="text-lg font-medium text-on-surface mt-8 mb-4 font-mono tracking-tight border-b border-outline-variant pb-2">
          {parseInlineStyles(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList(`flush-${i}`);
      elements.push(
        <h1 key={i} className="text-xl font-semibold text-on-surface mt-8 mb-4 font-display tracking-tight">
          {parseInlineStyles(line.slice(2))}
        </h1>
      );
    }
    // Handle Bullet Lists
    else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = line.trim().slice(2);
      if (currentListType !== "bullet") {
        flushList(`flush-${i}`);
        currentListType = "bullet";
      }
      currentList.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {parseInlineStyles(content)}
        </li>
      );
    }
    // Handle Numbered Lists
    else if (/^\d+\.\s/.test(line.trim())) {
      const content = line.trim().replace(/^\d+\.\s/, "");
      if (currentListType !== "number") {
        flushList(`flush-${i}`);
        currentListType = "number";
      }
      currentList.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {parseInlineStyles(content)}
        </li>
      );
    }
    // Handle Blockquotes
    else if (line.trim().startsWith("> ")) {
      flushList(`flush-${i}`);
      const content = line.trim().slice(2);
      elements.push(
        <blockquote key={i} className="border-l-2 border-primary bg-surface-container-low px-4 py-3 rounded-r-md italic text-on-surface/80 my-4 leading-relaxed">
          {parseInlineStyles(content)}
        </blockquote>
      );
    }
    // Handle Empty Lines
    else if (line.trim() === "") {
      flushList(`flush-${i}`);
    }
    // Handle Regular Paragraphs
    else {
      flushList(`flush-${i}`);
      elements.push(
        <p key={i} className="leading-relaxed text-on-surface/90 text-sm md:text-base my-3">
          {parseInlineStyles(line)}
        </p>
      );
    }
  }

  // Flush any final lists
  flushList("final");

  return <div className="space-y-1">{elements}</div>;
}
