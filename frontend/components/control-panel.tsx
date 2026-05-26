"use client";

import { Send, Square, Play, Trash2, Clock, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import type { BrowserCommand } from "@/lib/types";
import { useDashboardStore } from "@/stores/dashboard-store";

export function ControlPanel() {
  const device = useDashboardStore((state) => state.selectedDevice);
  const addEvent = useDashboardStore((state) => state.addEvent);
  const [presetMode, setPresetMode] = useState("amount");
  const [presetValue, setPresetValue] = useState("150");
  const [price, setPrice] = useState("52.47");
  const [monitorMode, setMonitorMode] = useState("85");
  const [sequence, setSequence] = useState("1");
  const [manual, setManual] = useState('{"action":"start"}');

  async function send(command: BrowserCommand) {
    if (!device) return;
    try {
      const result = await api.command(device.controller_id, device.device_id, command);
      addEvent({ ts: new Date().toISOString(), level: "success", source: "browser", message: `sent ${command.action}`, data: result });
    } catch (error) {
      addEvent({ ts: new Date().toISOString(), level: "error", source: "browser", message: error instanceof Error ? error.message : "command failed" });
    }
  }

  function sendManual() {
    try {
      send(JSON.parse(manual));
    } catch {
      addEvent({ ts: new Date().toISOString(), level: "error", source: "browser", message: "manual JSON is invalid" });
    }
  }

  return (
    <aside className="panel rounded p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-slate-300">Control Panel</h2>
        <SlidersHorizontal className="h-4 w-4 text-cyanline" />
      </div>
      <div className="mb-4 rounded border border-line bg-black/20 p-3 font-mono text-xs text-slate-300">
        {device ? `${device.controller_id} / device ${device.device_id}` : "Select a device"}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button disabled={!device} onClick={() => send({ action: "start" })} className="flex items-center justify-center gap-2 rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">
          <Play className="h-4 w-4" /> Start
        </button>
        <button disabled={!device} onClick={() => send({ action: "stop" })} className="flex items-center justify-center gap-2 rounded bg-danger px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">
          <Square className="h-4 w-4" /> Stop
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <select value={presetMode} onChange={(event) => setPresetMode(event.target.value)} className="rounded border border-line bg-[#0b151d] px-2 py-2 text-sm">
            <option value="amount">amount</option>
            <option value="volume">volume</option>
          </select>
          <input value={presetValue} onChange={(event) => setPresetValue(event.target.value)} className="rounded border border-line bg-[#0b151d] px-2 py-2 text-sm" />
          <button disabled={!device} onClick={() => send({ action: "preset", params: { mode: presetMode, value: Number(presetValue) } })} className="rounded border border-cyanline px-3 py-2 text-sm text-cyanline disabled:opacity-40">
            Preset
          </button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input value={price} onChange={(event) => setPrice(event.target.value)} className="rounded border border-line bg-[#0b151d] px-2 py-2 text-sm" />
          <button disabled={!device} onClick={() => send({ action: "setPrice", params: { price: Number(price) } })} className="rounded border border-cyanline px-3 py-2 text-sm text-cyanline disabled:opacity-40">
            Set Price
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button disabled={!device} onClick={() => send({ action: "setDateTime" })} className="flex items-center justify-center gap-2 rounded border border-line px-3 py-2 text-sm disabled:opacity-40">
            <Clock className="h-4 w-4" /> DateTime
          </button>
          <button disabled={!device} onClick={() => send({ action: "deleteTransaction" })} className="flex items-center justify-center gap-2 rounded border border-line px-3 py-2 text-sm disabled:opacity-40">
            <Trash2 className="h-4 w-4" /> Delete Tx
          </button>
        </div>
        <div className="border-t border-line pt-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input value={monitorMode} onChange={(event) => setMonitorMode(event.target.value)} className="rounded border border-line bg-[#0b151d] px-2 py-2 text-sm" />
            <button disabled={!device} onClick={() => send({ action: "setMonitorMode", params: { monitorMode: Number(monitorMode) } })} className="rounded border border-amberline px-3 py-2 text-sm text-amberline disabled:opacity-40">
              Monitor
            </button>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <input value={sequence} onChange={(event) => setSequence(event.target.value)} className="rounded border border-line bg-[#0b151d] px-2 py-2 text-sm" />
            <button disabled={!device} onClick={() => send({ action: "cancelPreset", params: { sequence: Number(sequence) } })} className="rounded border border-amberline px-3 py-2 text-sm text-amberline disabled:opacity-40">
              Cancel
            </button>
          </div>
        </div>
        <textarea value={manual} onChange={(event) => setManual(event.target.value)} className="h-24 w-full rounded border border-line bg-black/30 p-2 font-mono text-xs text-slate-200" />
        <button disabled={!device} onClick={sendManual} className="flex w-full items-center justify-center gap-2 rounded bg-cyanline px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">
          <Send className="h-4 w-4" /> Send Manual JSON
        </button>
      </div>
    </aside>
  );
}
