"use client";

import { useEffect } from "react";
import { WS_BASE, api } from "@/lib/api";
import type { CommandResponseRow, EventLogRow, JsonAsgEnvelope, StreamPacket } from "@/lib/types";
import { useDashboardStore } from "@/stores/dashboard-store";

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function objectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item)) : [];
}

function isMissingSequenceResponse(response: Record<string, unknown>): boolean {
  const text = JSON.stringify(response).toLowerCase();
  return text.includes("missing_sequence") || text.includes("missing sequence") || text.includes("missingsequence") || text.includes("sequence=");
}

export function useDashboardSocket() {
  const setControllers = useDashboardStore((state) => state.setControllers);
  const setDevices = useDashboardStore((state) => state.setDevices);
  const setEvents = useDashboardStore((state) => state.setEvents);
  const addEvent = useDashboardStore((state) => state.addEvent);
  const addEventLogs = useDashboardStore((state) => state.addEventLogs);
  const addCommandResponses = useDashboardStore((state) => state.addCommandResponses);
  const addStreamPacket = useDashboardStore((state) => state.addStreamPacket);
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
          handleJsonASGPacket(payload.envelope, payload.controller_id ?? "controller");
        }
      };
    }

    function handleJsonASGPacket(envelope: JsonAsgEnvelope, controllerId: string) {
      const ts = envelope.updated_at ?? new Date().toISOString();
      const streamPacket: StreamPacket = {
        id: `${controllerId}-${envelope.Type}-${ts}-${Math.random().toString(36).slice(2)}`,
        ts,
        controller_id: controllerId,
        type: envelope.Type,
        envelope,
      };
      addStreamPacket(streamPacket);

      if (envelope.Type === "Realtime") {
        return;
      }

      if (envelope.Type === "Event") {
        const rows: EventLogRow[] = objectArray(envelope.Packet.Events).map((event, index) => ({
          id: `${streamPacket.id}-event-${index}`,
          ts,
          controller_id: controllerId,
          category: stringValue(event.category),
          error_code: stringValue(event.error_code),
          message: stringValue(event.message),
          device_id: numberValue(event.device_id),
          pump_addr: numberValue(event.pump_addr),
          nozzle_id: numberValue(event.nozzle_id),
          command: stringValue(event.command),
          occurred_at: stringValue(event.occurred_at),
          raw: event,
        }));
        addEventLogs(rows);
        return;
      }

      if (envelope.Type === "CommandResponse") {
        const responses = objectArray(envelope.Packet.CommandResponses);
        const rows: CommandResponseRow[] = responses.map((response, index) => ({
          id: `${streamPacket.id}-command-${index}`,
          ts,
          controller_id: controllerId,
          command: stringValue(response.command),
          response_code: stringValue(response.response_code),
          success: typeof response.success === "boolean" ? response.success : undefined,
          message: stringValue(response.message),
          error_code: stringValue(response.error_code),
          device_id: numberValue(response.device_id),
          occurred_at: stringValue(response.occurred_at),
          raw: response,
        }));
        addCommandResponses(rows);
        if (responses.some(isMissingSequenceResponse)) {
          addEvent({
            ts,
            level: "error",
            source: "command",
            message: "Cannot auto-cancel preset because no preset sequence is remembered. Enter the sequence manually.",
          });
        }
      }
    }

    loadInitial().catch((error) => addEvent({ ts: new Date().toISOString(), level: "error", source: "frontend", message: error.message }));
    connect();

    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [addCommandResponses, addEvent, addEventLogs, addStreamPacket, setConnected, setControllers, setDevices, setEvents]);
}
