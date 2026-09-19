"use client";

import { useEffect, useRef, useState } from "react";

let mermaidReady: Promise<typeof import("mermaid").default> | null = null;

// Mermaid touches the DOM at init time, so it can only load in the browser — this loads
// it lazily (once, shared across every diagram on the page) instead of importing it at
// module scope, which would break server rendering.
function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid").then((mod) => {
      mod.default.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
      return mod.default;
    });
  }
  return mermaidReady;
}

export default function MermaidDiagram({ definition, title }: { definition: string; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    loadMermaid()
      .then((mermaid) => mermaid.render(`mermaid-${Math.random().toString(36).slice(2)}`, definition))
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [definition]);

  // The diagram spec comes from the model — an occasional malformed one shouldn't break the page,
  // just skip rendering it silently since the text feedback around it still stands on its own.
  if (failed) return null;

  return (
    <div>
      {title && (
        <p className="font-mono text-[11px] text-stamp uppercase tracking-wide mb-1">{title}</p>
      )}
      <div ref={containerRef} className="overflow-x-auto [&_svg]:mx-auto" />
    </div>
  );
}
