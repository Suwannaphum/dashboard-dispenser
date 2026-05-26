"use client";

import { Cpu } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { StatusDot } from "./status-dot";

export function ControllerStrip() {
  const controllers = useDashboardStore((state) => state.controllers);
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {controllers.length === 0 ? (
        <div className="panel scanline rounded p-4 text-sm text-slate-400">No Pi4 controllers connected.</div>
      ) : (
        controllers.map((controller) => (
          <div key={controller.controller_id} className="panel rounded p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyanline" />
                <span className="font-mono text-sm text-white">{controller.controller_id}</span>
              </div>
              <StatusDot online={controller.online} />
            </div>
            <div className="mt-3 truncate font-mono text-xs text-slate-400">{controller.deviceId}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">Pumps</div>
              <div className="text-right text-slate-200">{controller.pump_count}</div>
              <div className="text-slate-500">Last activity</div>
              <div className="text-right text-slate-200">{new Date(controller.last_activity).toLocaleTimeString()}</div>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
