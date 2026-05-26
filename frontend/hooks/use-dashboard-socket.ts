"use client";

import { useEffect } from "react";
import { WS_BASE, api } from "@/lib/api";
import { useDashboardStore } from "@/stores/dashboard-store";

export function useDashboardSocket() {
  const setControllers = useDashboardStore((state) => state.setControllers);
  const setDevices = useDashboardStore((state) => state.setDevices);
  const setEvents = useDashboardStore((state) => state.setEvents);
  const addEvent = useDashboardStore((state) => state.addEvent);
  const setConnected = useDashboardStore((state) => state.setConnected);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    async function loadInitial() {
      const [controllers, devices, events] = await Promise.all([api.controllers(), api.devices(), api.events()]);
      setControllers(controllers);
      setDevices(devices);
      setEvents(events);
    }

    function connect() {
      socket = new WebSocket(`${WS_BASE}/ws/dashboard`);
      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        if (!stopped) retry = setTimeout(connect, 1500);
      };
      socket.onerror = () => setConnected(false);
      socket.onmessage = (message) => {
        const payload = JSON.parse(message.data);
        if (payload.controllers) setControllers(payload.controllers);
        if (payload.devices) setDevices(payload.devices);
        if (payload.events) setEvents(payload.events);
        if (payload.event) addEvent(payload.event);
        if (payload.envelope) {
          addEvent({
            ts: payload.envelope.updated_at ?? new Date().toISOString(),
            level: payload.type === "Realtime" ? "status" : "success",
            source: payload.controller_id ?? "controller",
            message: payload.type,
            data: payload.envelope,
          });
        }
      };
    }

    loadInitial().catch((error) => addEvent({ ts: new Date().toISOString(), level: "error", source: "frontend", message: error.message }));
    connect();

    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [addEvent, setConnected, setControllers, setDevices, setEvents]);
}
