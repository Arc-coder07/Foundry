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
    <div ref={ref} className="w-full my-8 bg-surface-container-low p-6 rounded-xl border border-outline-variant/50 shadow-inner">
      {svg ? (
        <div 
          className="w-full flex justify-center mermaid-container"
          dangerouslySetInnerHTML={{ __html: svg }} 
        />
      ) : (
        <div className="text-text-muted text-xs animate-pulse">Rendering diagram...</div>
      )}
    </div>
  );
};

export function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  return (
    <div className="prose prose-lg prose-invert max-w-none leading-relaxed
      prose-headings:font-display prose-headings:tracking-tight prose-headings:text-on-surface
      prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-8
      prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-outline-variant/30 prose-h2:pb-2
      prose-h3:text-xl prose-h3:font-mono prose-h3:text-primary
      prose-a:text-primary hover:prose-a:text-primary/80 
      prose-code:text-sm prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:text-on-surface prose-code:font-semibold
      prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-outline-variant prose-pre:text-text-muted prose-pre:p-6 prose-pre:rounded-xl prose-pre:shadow-inner
      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-surface-container-low prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:rounded-r-lg prose-blockquote:text-on-surface/90 prose-blockquote:font-medium
      prose-table:w-full prose-table:border-collapse prose-table:text-base prose-table:my-8
      prose-th:border prose-th:border-outline-variant prose-th:bg-surface-container-high prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-bold
      prose-td:border prose-td:border-outline-variant prose-td:px-4 prose-td:py-3
      prose-img:rounded-xl prose-img:border prose-img:border-outline-variant prose-img:shadow-lg
      prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-2 text-on-surface/95">
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
