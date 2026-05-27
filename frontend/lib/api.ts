import type { BrowserCommand, ControllerInfo, DeviceState, EventEntry } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://192.168.1.113:9090";
export const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE ?? "ws://192.168.1.113:9090";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

export const api = {
  controllers: () => getJson<ControllerInfo[]>("/controllers"),
  devices: () => getJson<DeviceState[]>("/devices"),
  events: () => getJson<EventEntry[]>("/events"),
  raw: () => getJson<Record<string, unknown[]>>("/raw"),
  deviceDetail: (controllerId: string, deviceId: number) => getJson<DeviceState>(`/controllers/${controllerId}/devices/${deviceId}`),
  command: async (controllerId: string, deviceId: number, command: BrowserCommand) => {
    const response = await fetch(`${API_BASE}/controllers/${controllerId}/devices/${deviceId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.detail ?? "command failed");
    return body;
  },
};
