"use client";

import { Eraser, Lock, Unlock } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";

const colorMap = {
  success: "text-emerald-300",
  warning: "text-amberline",
  error: "text-danger",
  status: "text-cyanline",
  info: "text-slate-300",
};

export function TerminalPanel() {
  const events = useDashboardStore((state) => state.events);
  const clearEvents = useDashboardStore((state) => state.clearEvents);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    if (!autoScrollRef.current || !terminalRef.current) return;
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [events]);

  return (
    <section className="panel flex h-[420px] flex-col rounded">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-slate-300">Terminal Events</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              autoScrollRef.current = !autoScrollRef.current;
            }}
            className="rounded border border-line p-2 text-slate-300 hover:text-white"
            title="Toggle terminal auto-scroll"
          >
            {autoScrollRef.current ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </button>
          <button onClick={clearEvents} className="rounded border border-line p-2 text-slate-300 hover:text-white" title="Clear terminal">
            <Eraser className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="scanline flex-1 overflow-y-auto bg-black/30 p-3 font-mono text-xs">
        {events.map((event, index) => (
          <div key={`${event.ts}-${index}`} className="mb-2">
            <span className="text-slate-600">{new Date(event.ts).toLocaleTimeString()} </span>
            <span className={colorMap[event.level]}>[{event.level}]</span>
            <span className="text-slate-400"> {event.source}: </span>
            <span className="text-slate-200">{event.message}</span>
            {event.data ? <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-500">{JSON.stringify(event.data, null, 2)}</pre> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
