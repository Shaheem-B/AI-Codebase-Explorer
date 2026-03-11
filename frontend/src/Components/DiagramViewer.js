"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export default function DiagramViewer({ chart }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!chart) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      }
    });

    const render = async () => {
      try {
        const id = "diagram-" + Date.now();
        const { svg } = await mermaid.render(id, chart);

        if (ref.current) {
          ref.current.innerHTML = svg;

          const svgEl = ref.current.querySelector("svg");

          if (svgEl) {
            svgEl.style.width = "100%";
            svgEl.style.height = "auto";
            svgEl.style.display = "block";
            svgEl.style.margin = "0 auto";
            svgEl.style.background = "white";
            svgEl.style.borderRadius = "16px";
            svgEl.style.padding = "20px";
          }
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
      }
    };

    render();
  }, [chart]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div
        className="
        w-full
        max-h-[700px]
        overflow-auto
        rounded-xl
        bg-slate-100
        p-6
      "
      >
        <div ref={ref} className="min-w-[900px]" />
      </div>
    </div>
  );
}