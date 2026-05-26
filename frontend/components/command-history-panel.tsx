"use client";

import { Eraser } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";

export function CommandHistoryPanel() {
  const responses = useDashboardStore((state) => state.commandResponses);
  const clearCommandResponses = useDashboardStore((state) => state.clearCommandResponses);

  return (
    <section className="panel flex h-[300px] flex-col rounded">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-slate-300">Command History</h2>
        <button onClick={clearCommandResponses} className="rounded border border-line p-2 text-slate-300 hover:text-white" title="Clear command history">
          <Eraser className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-black/25 p-3 font-mono text-xs">
        {responses.length === 0 ? <div className="text-slate-500">No CommandResponse packets received.</div> : null}
        {responses.map((response) => (
          <div key={response.id} className="mb-3 rounded border border-line/70 bg-black/20 p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-slate-200">{response.command ?? "command"}</span>
              <span className={`rounded px-2 py-1 text-[11px] font-semibold ${response.success ? "bg-emerald-400/15 text-emerald-300" : "bg-danger/15 text-danger"}`}>
                {response.success ? "SUCCESS" : "FAILED"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
              <span>response: <span className="text-slate-300">{response.response_code || "-"}</span></span>
              <span>device: <span className="text-slate-300">{response.device_id ?? "-"}</span></span>
              <span>message: <span className="text-slate-300">{response.message || "-"}</span></span>
              <span>error: <span className="text-danger">{response.error_code || "-"}</span></span>
              <span>time: <span className="text-slate-300">{response.occurred_at ?? response.ts}</span></span>
              <span>source: <span className="text-cyanline">{response.controller_id}</span></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
