import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

interface MarkdownProps {
  content: string;
}

// Initialize Mermaid with a dark theme fitting the app's aesthetic
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose'
});

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState<string>("");

  useEffect(() => {
    let isMounted = true;
    if (ref.current && chart) {
      // Create a unique ID for the mermaid render to avoid collisions
      const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      mermaid.render(id, chart)
        .then(result => {
          if (isMounted) setSvg(result.svg);
        })
        .catch(e => {
          console.error("Mermaid parsing failed", e);
          if (isMounted) setSvg(`<div class="text-red-400 text-xs">Failed to render diagram</div>`);
        });
    }
    return () => { isMounted = false; };
  }, [chart]);

  return (
    <div ref={ref} className="flex justify-center my-6 overflow-x-auto bg-surface-container-low p-4 rounded-lg border border-outline-variant/30">
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="text-text-muted text-xs animate-pulse">Rendering diagram...</div>
      )}
    </div>
  );
};

export function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  return (
    <div className="prose prose-sm prose-invert max-w-none 
      prose-headings:font-display prose-headings:tracking-tight prose-headings:text-on-surface
      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h3:font-mono 
      prose-a:text-primary hover:prose-a:text-primary/80 
      prose-code:text-xs prose-code:bg-surface-container prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:text-on-surface
      prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-outline-variant prose-pre:text-text-muted prose-pre:p-4 prose-pre:rounded-lg
      prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:bg-surface-container-low prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:rounded-r-md prose-blockquote:text-on-surface/80
      prose-table:w-full prose-table:border-collapse prose-table:text-sm
      prose-th:border prose-th:border-outline-variant prose-th:bg-surface-container-high prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold
      prose-td:border prose-td:border-outline-variant prose-td:px-3 prose-td:py-2
      prose-img:rounded-lg prose-img:border prose-img:border-outline-variant
      prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 text-on-surface/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: any) {
            const {children, className, node, ...rest} = props;
            const match = /language-(\w+)/.exec(className || '');
            const isMermaid = match && match[1] === 'mermaid';
            
            if (isMermaid) {
              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }
            
            return match ? (
              <pre {...rest} className={className}>
                <code>
                  {children}
                </code>
              </pre>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
