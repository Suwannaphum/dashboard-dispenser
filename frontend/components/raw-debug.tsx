"use client";

import { Bug, Eraser } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StreamFilter } from "@/lib/types";
import { useDashboardStore } from "@/stores/dashboard-store";

const filters: StreamFilter[] = ["All", "Realtime", "Event", "CommandResponse"];

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function highlightJson(value: unknown) {
  const escaped = escapeHtml(JSON.stringify(value, null, 2));
  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let className = "text-amberline";
      if (/^"/.test(match)) className = /:$/.test(match) ? "text-cyanline" : "text-emerald-300";
      else if (/true|false/.test(match)) className = "text-violet-300";
      else if (/null/.test(match)) className = "text-slate-500";
      return `<span class="${className}">${match}</span>`;
    },
  );
}

export function RawDebug() {
  const [open, setOpen] = useState(false);
  const streamPackets = useDashboardStore((state) => state.streamPackets);
  const streamFilter = useDashboardStore((state) => state.streamFilter);
  const setStreamFilter = useDashboardStore((state) => state.setStreamFilter);
  const clearStreamPackets = useDashboardStore((state) => state.clearStreamPackets);
  const rawRef = useRef<HTMLDivElement | null>(null);
  const filtered = useMemo(
    () => streamPackets.filter((packet) => streamFilter === "All" || packet.type === streamFilter),
    [streamFilter, streamPackets],
  );

  useEffect(() => {
    if (!rawRef.current) return;
    rawRef.current.scrollTop = rawRef.current.scrollHeight;
  }, [filtered]);

  return (
    <section className="panel rounded p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-slate-300">Raw JSON Stream</h2>
        <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded border border-line px-3 py-2 text-sm text-slate-200">
          <Bug className="h-4 w-4 text-cyanline" /> {open ? "Hide Raw" : "Show Raw"}
        </button>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setStreamFilter(filter)}
            className={`rounded border px-3 py-1.5 font-mono text-xs ${streamFilter === filter ? "border-cyanline bg-cyanline/10 text-cyanline" : "border-line text-slate-400"}`}
          >
            {filter === "Event" ? "Events" : filter === "CommandResponse" ? "CommandResponses" : filter}
          </button>
        ))}
        <button onClick={clearStreamPackets} className="ml-auto rounded border border-line p-1.5 text-slate-300 hover:text-white" title="Clear raw stream">
          <Eraser className="h-4 w-4" />
        </button>
      </div>
      {open ? (
        <div ref={rawRef} className="max-h-96 overflow-auto rounded bg-black/30 p-3 font-mono text-xs">
          {filtered.length === 0 ? <div className="text-slate-500">No packets for this filter.</div> : null}
          {filtered.map((packet) => (
            <div key={packet.id} className="mb-4 border-b border-line/60 pb-4">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="text-cyanline">{packet.type}</span>
                <span className="text-slate-600">{packet.ts}</span>
              </div>
              <pre className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlightJson(packet.envelope) }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border border-line bg-black/20 p-3 font-mono text-xs text-slate-500">
          {filtered.length} packets buffered. Use filters without stopping WebSocket processing.
        </div>
      )}
    </section>
  );
}
