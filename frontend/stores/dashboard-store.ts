import { create } from "zustand";
import type { ControllerInfo, DeviceState, EventEntry } from "@/lib/types";

type DashboardState = {
  controllers: ControllerInfo[];
  devices: DeviceState[];
  events: EventEntry[];
  selectedDevice?: DeviceState;
  connected: boolean;
  terminalPaused: boolean;
  setControllers: (controllers: ControllerInfo[]) => void;
  setDevices: (devices: DeviceState[]) => void;
  setEvents: (events: EventEntry[]) => void;
  addEvent: (event: EventEntry) => void;
  setSelectedDevice: (device?: DeviceState) => void;
  setConnected: (connected: boolean) => void;
  clearEvents: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  controllers: [],
  devices: [],
  events: [],
  connected: false,
  terminalPaused: false,
  setControllers: (controllers) => set({ controllers }),
  setDevices: (devices) => set({ devices }),
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events.slice(-249), event] })),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setConnected: (connected) => set({ connected }),
  clearEvents: () => set({ events: [] }),
}));
