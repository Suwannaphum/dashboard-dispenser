export type ControllerInfo = {
  controller_id: string;
  deviceId: string;
  online: boolean;
  last_activity: string;
  pump_count: number;
};

export type DeviceState = {
  controller_id: string;
  deviceId: string;
  device_id: number;
  pump?: number | null;
  nozzle?: number | null;
  pump_nozzle: string;
  status: string;
  nozzle_online: boolean;
  nozzle_lifted: boolean;
  data_error: boolean;
  state?: number | null;
  preset_by_console: boolean;
  tx_available: boolean;
  current_sales: number;
  current_volume: number;
  unit_price: number;
  sales_total: number;
  volume_total: number;
  fueling_state: string;
  last_update: string;
  online: boolean;
};

export type EventEntry = {
  ts: string;
  level: "success" | "warning" | "error" | "status" | "info";
  source: string;
  message: string;
  data?: Record<string, unknown>;
};

export type JsonAsgType = string;

export type JsonAsgEnvelope = {
  Protocol: "jsonASG";
  DeviceID: string;
  Type: JsonAsgType;
  Packet: Record<string, unknown>;
  updated_at?: string;
};

export type StreamFilter = "All" | "Realtime" | "Events";

export type StreamPacket = {
  id: string;
  ts: string;
  controller_id: string;
  type: JsonAsgType;
  envelope: JsonAsgEnvelope;
};

export type EventLogRow = {
  id: string;
  ts: string;
  controller_id: string;
  envelope_type: string;
  category?: string;
  event?: string;
  level?: string;
  error_code?: string;
  message?: string;
  detail?: string;
  response_code?: string;
  success?: boolean;
  device_id?: number;
  pump_addr?: number;
  nozzle_id?: number;
  command?: string;
  timeout_ms?: number;
  occurred_at?: string;
  raw: Record<string, unknown>;
};

export type BrowserCommand = {
  action: "start" | "stop" | "preset" | "setPrice" | "setDateTime" | "deleteTransaction" | "setMonitorMode" | "cancelPreset";
  params?: Record<string, unknown>;
};
