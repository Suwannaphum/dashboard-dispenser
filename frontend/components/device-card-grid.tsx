"use client";

import { Activity, Gauge, Radio, ReceiptText, ShieldAlert, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DeviceState } from "@/lib/types";
import { useDashboardStore } from "@/stores/dashboard-store";
import { StatusDot } from "./status-dot";

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function stateLabel(device: DeviceState) {
  if (device.data_error) return "ERROR";
  if (!device.online) return "OFFLINE";
  if (device.preset_by_console) return "PRESET BY CONSOLE";
  if (device.state === 2 || device.state === 3) return "FUELING";
  if (device.state === 0) return "STOPPED / UNLOCKED";
  if (device.state === 1) return "STOPPED / LOCKED";
  return device.fueling_state.replaceAll("_", " ").toUpperCase();
}

function stateTone(device: DeviceState) {
  if (device.data_error) return "border-danger/60 bg-danger/10 text-danger shadow-[0_0_22px_rgba(255,93,93,0.15)]";
  if (!device.online) return "border-slate-700 bg-slate-800/30 text-slate-400";
  if (device.state === 2 || device.state === 3) return "border-emerald-400/60 bg-emerald-400/10 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.16)]";
  if (device.preset_by_console) return "border-amberline/60 bg-amberline/10 text-amberline";
  return "border-cyanline/40 bg-cyanline/10 text-cyanline";
}

function Flag({ label, value, error }: { label: string; value: boolean | number | null | undefined; error?: boolean }) {
  const isNumber = typeof value === "number";
  const active = Boolean(value);
  const dotColor = error ? "bg-danger" : active ? "bg-emerald-400" : "bg-slate-600";
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-line/80 bg-black/20 px-2.5 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="flex items-center gap-2 font-mono text-slate-200">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        {isNumber ? value : active ? "true" : "false"}
      </span>
    </div>
  );
}

function RealtimeValue({ label, value, unit }: { label: string; value: number; unit: string }) {
  const previous = useRef(value);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (previous.current !== value) {
      setChanged(true);
      previous.current = value;
      const timeout = setTimeout(() => setChanged(false), 650);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <div className={`rounded border bg-[#081219] p-3 transition-all duration-300 ${changed ? "border-cyanline shadow-[0_0_24px_rgba(37,208,200,0.18)]" : "border-line"}`}>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-mono text-cyanline">{unit}</span>
      </div>
      <div className="font-mono text-3xl font-semibold leading-none text-white md:text-4xl">{formatNumber(value)}</div>
    </div>
  );
}

function DeviceCard({ device }: { device: DeviceState }) {
  const selectedDevice = useDashboardStore((state) => state.selectedDevice);
  const setSelectedDevice = useDashboardStore((state) => state.setSelectedDevice);
  const selected = selectedDevice?.controller_id === device.controller_id && selectedDevice.device_id === device.device_id;

  return (
    <article
      onClick={() => setSelectedDevice(device)}
      className={`panel rounded border p-4 transition hover:border-cyanline/70 ${selected ? "border-cyanline shadow-[0_0_28px_rgba(37,208,200,0.12)]" : "border-line"} ${device.online ? "shadow-[inset_0_1px_0_rgba(37,208,200,0.12)]" : ""}`}
    >
      <header className="border-b border-line pb-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusDot online={device.online} />
              <h3 className="truncate text-lg font-semibold text-white">{device.pump_nozzle}</h3>
            </div>
            <div className="mt-1 font-mono text-xs text-slate-500">{device.controller_id}</div>
          </div>
          <div className="rounded border border-line bg-black/30 px-2 py-1 font-mono text-xs text-cyanline">ID {device.device_id}</div>
        </div>
        <div className="truncate font-mono text-xs text-slate-500">{device.deviceId}</div>
      </header>

      <section className={`mt-4 rounded border px-3 py-4 ${stateTone(device)}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.18em] opacity-75">Fueling State</div>
            <div className="mt-1 text-xl font-semibold">{stateLabel(device)}</div>
          </div>
          {device.data_error ? <ShieldAlert className="h-8 w-8" /> : device.state === 2 || device.state === 3 ? <Zap className="h-8 w-8" /> : <Radio className="h-8 w-8" />}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
        <Flag label="nozzle_online" value={device.nozzle_online} />
        <Flag label="nozzle_lifted" value={device.nozzle_lifted} />
        <Flag label="data_error" value={device.data_error} error={device.data_error} />
        <Flag label="state" value={device.state} />
        <Flag label="preset_console" value={device.preset_by_console} />
        <Flag label="tx_available" value={device.tx_available} />
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <RealtimeValue label="Current Sales" value={device.current_sales} unit="THB" />
        <RealtimeValue label="Current Volume" value={device.current_volume} unit="Liter" />
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded border border-line bg-black/20 p-3">
          <Gauge className="mb-2 h-4 w-4 text-cyanline" />
          <div className="text-xs text-slate-500">Unit Price</div>
          <div className="font-mono text-sm text-white">{formatNumber(device.unit_price)}</div>
          <div className="text-[11px] text-slate-600">THB/Liter</div>
        </div>
        <div className="rounded border border-line bg-black/20 p-3">
          <ReceiptText className="mb-2 h-4 w-4 text-amberline" />
          <div className="text-xs text-slate-500">Sales Total</div>
          <div className="font-mono text-sm text-white">{formatNumber(device.sales_total)}</div>
          <div className="text-[11px] text-slate-600">THB</div>
        </div>
        <div className="rounded border border-line bg-black/20 p-3">
          <Activity className="mb-2 h-4 w-4 text-emerald-300" />
          <div className="text-xs text-slate-500">Volume Total</div>
          <div className="font-mono text-sm text-white">{formatNumber(device.volume_total)}</div>
          <div className="text-[11px] text-slate-600">Liter</div>
        </div>
      </section>

      <footer className="mt-4 grid grid-cols-[1fr_auto] gap-3 border-t border-line pt-3 font-mono text-xs">
        <div className="min-w-0">
          <div className="text-slate-600">last_update</div>
          <div className="truncate text-slate-300">{device.last_update}</div>
        </div>
        <div className="text-right">
          <div className="text-slate-600">status</div>
          <div className={device.online ? "text-emerald-300" : "text-slate-500"}>{device.status}</div>
        </div>
      </footer>
    </article>
  );
}

export function DeviceCardGrid() {
  const devices = useDashboardStore((state) => state.devices);
  const sortedDevices = [...devices].sort((a, b) => a.controller_id.localeCompare(b.controller_id) || a.device_id - b.device_id);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-slate-300">Realtime Device Cards</h2>
        <div className="font-mono text-xs text-slate-500">{sortedDevices.length} devices</div>
      </div>
      {sortedDevices.length === 0 ? (
        <div className="panel scanline rounded p-6 text-sm text-slate-400">No realtime pump/nozzle data received yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {sortedDevices.map((device) => (
            <DeviceCard key={`${device.controller_id}-${device.device_id}`} device={device} />
          ))}
        </div>
      )}
    </section>
  );
}
