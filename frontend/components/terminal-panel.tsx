"use client";

import { Eraser, Lock, Unlock } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";

export function TerminalPanel() {
  const eventLogs = useDashboardStore((state) => state.eventLogs);
  const clearEvents = useDashboardStore((state) => state.clearEvents);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    if (!autoScrollRef.current || !terminalRef.current) return;
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [eventLogs]);

  return (
    <section className="panel flex h-[420px] flex-col rounded">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-slate-300">Event / Error Panel</h2>
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
        {eventLogs.length === 0 ? <div className="text-slate-500">No Event packets received.</div> : null}
        {eventLogs.map((event) => (
          <div key={event.id} className="mb-3 rounded border border-line/70 bg-black/20 p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-danger">[{event.category ?? "event"}]</span>
              <span className="text-slate-600">{event.occurred_at ?? event.ts}</span>
            </div>
            <div className="text-slate-200">{event.message ?? "Event packet"}</div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-500">
              <span>error: <span className="text-danger">{event.error_code || "-"}</span></span>
              <span>device: <span className="text-slate-300">{event.device_id ?? "-"}</span></span>
              <span>pump: <span className="text-slate-300">{event.pump_addr ?? "-"}</span></span>
              <span>nozzle: <span className="text-slate-300">{event.nozzle_id ?? "-"}</span></span>
              <span>command: <span className="text-amberline">{event.command || "-"}</span></span>
              <span>source: <span className="text-cyanline">{event.controller_id}</span></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
