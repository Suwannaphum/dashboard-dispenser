"use client";

import { Activity, RadioTower } from "lucide-react";
import { CommandHistoryPanel } from "@/components/command-history-panel";
import { ControllerStrip } from "@/components/controller-strip";
import { ControlPanel } from "@/components/control-panel";
import { DeviceCardGrid } from "@/components/device-card-grid";
import { RawDebug } from "@/components/raw-debug";
import { TerminalPanel } from "@/components/terminal-panel";
import { useDashboardSocket } from "@/hooks/use-dashboard-socket";
import { useDashboardStore } from "@/stores/dashboard-store";

export default function DashboardPage() {
  useDashboardSocket();
  const connected = useDashboardStore((state) => state.connected);
  const devices = useDashboardStore((state) => state.devices);
  const onlineDevices = devices.filter((device) => device.online).length;

  return (
    <main className="min-h-screen bg-[#071015] p-4 text-slate-100 md:p-6">
      <header className="mb-5 flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-cyanline">
            <RadioTower className="h-4 w-4" /> Dashboard Backend Relay
          </div>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Industrial Fuel Dispenser Dashboard</h1>
        </div>
        <div className="grid grid-cols-3 gap-3 font-mono text-xs">
          <div className="panel rounded px-4 py-3">
            <div className="text-slate-500">WS</div>
            <div className={connected ? "text-emerald-300" : "text-danger"}>{connected ? "ONLINE" : "OFFLINE"}</div>
          </div>
          <div className="panel rounded px-4 py-3">
            <div className="text-slate-500">Devices</div>
            <div className="text-white">{devices.length}</div>
          </div>
          <div className="panel rounded px-4 py-3">
            <div className="text-slate-500">Active</div>
            <div className="flex items-center gap-2 text-cyanline">
              <Activity className="h-4 w-4" /> {onlineDevices}
            </div>
          </div>
        </div>
      </header>
      <div className="space-y-4">
        <ControllerStrip />
        <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
          <div className="space-y-4">
            <DeviceCardGrid />
            <RawDebug />
          </div>
          <div className="space-y-4">
            <ControlPanel />
            <TerminalPanel />
            <CommandHistoryPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
