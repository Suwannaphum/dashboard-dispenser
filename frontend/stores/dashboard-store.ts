import { create } from "zustand";
import type { CommandResponseRow, ControllerInfo, DeviceState, EventEntry, EventLogRow, StreamFilter, StreamPacket } from "@/lib/types";

type DashboardState = {
  controllers: ControllerInfo[];
  devices: DeviceState[];
  events: EventEntry[];
  eventLogs: EventLogRow[];
  commandResponses: CommandResponseRow[];
  streamPackets: StreamPacket[];
  streamFilter: StreamFilter;
  selectedDevice?: DeviceState;
  connected: boolean;
  terminalPaused: boolean;
  setControllers: (controllers: ControllerInfo[]) => void;
  setDevices: (devices: DeviceState[]) => void;
  setEvents: (events: EventEntry[]) => void;
  addEvent: (event: EventEntry) => void;
  addEventLogs: (events: EventLogRow[]) => void;
  addCommandResponses: (responses: CommandResponseRow[]) => void;
  addStreamPacket: (packet: StreamPacket) => void;
  setStreamFilter: (filter: StreamFilter) => void;
  setSelectedDevice: (device?: DeviceState) => void;
  setConnected: (connected: boolean) => void;
  clearEvents: () => void;
  clearCommandResponses: () => void;
  clearStreamPackets: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  controllers: [],
  devices: [],
  events: [],
  eventLogs: [],
  commandResponses: [],
  streamPackets: [],
  streamFilter: "All",
  connected: false,
  terminalPaused: false,
  setControllers: (controllers) => set({ controllers }),
  setDevices: (devices) => set({ devices }),
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events.slice(-249), event] })),
  addEventLogs: (events) => set((state) => ({ eventLogs: [...state.eventLogs, ...events].slice(-300) })),
  addCommandResponses: (responses) => set((state) => ({ commandResponses: [...state.commandResponses, ...responses].slice(-300) })),
  addStreamPacket: (packet) => set((state) => ({ streamPackets: [...state.streamPackets, packet].slice(-300) })),
  setStreamFilter: (filter) => set({ streamFilter: filter }),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setConnected: (connected) => set({ connected }),
  clearEvents: () => set({ events: [], eventLogs: [] }),
  clearCommandResponses: () => set({ commandResponses: [] }),
  clearStreamPackets: () => set({ streamPackets: [] }),
}));
