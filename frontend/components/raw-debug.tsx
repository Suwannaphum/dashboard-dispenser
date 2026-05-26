"use client";

import { Bug } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";

export function RawDebug() {
  const [raw, setRaw] = useState<Record<string, unknown[]> | null>(null);

  async function loadRaw() {
    setRaw(await api.raw());
  }

  return (
    <section className="panel rounded p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-slate-300">Raw jsonASG</h2>
        <button onClick={loadRaw} className="flex items-center gap-2 rounded border border-line px-3 py-2 text-sm text-slate-200">
          <Bug className="h-4 w-4 text-cyanline" /> Load Raw
        </button>
      </div>
      <pre className="max-h-72 overflow-auto rounded bg-black/30 p-3 font-mono text-xs text-slate-400">{raw ? JSON.stringify(raw, null, 2) : "Raw debug output will appear here."}</pre>
    </section>
  );
}
