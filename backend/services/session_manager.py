import asyncio
from collections import deque
from typing import Any

from fastapi import WebSocket
from models.schemas import BrowserCommand, ControllerInfo, DeviceState, EventEntry, JsonAsgEnvelope, utc_now


class SessionManager:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._next_controller_number = 1
        self.controllers_by_device_id: dict[str, str] = {}
        self.controller_sockets: dict[str, WebSocket] = {}
        self.controller_device_ids: dict[str, str] = {}
        self.controller_last_activity: dict[str, str] = {}
        self.devices: dict[tuple[str, int], DeviceState] = {}
        self.raw_envelopes: dict[str, list[dict[str, Any]]] = {}
        self.dashboard_clients: set[WebSocket] = set()
        self.events: deque[EventEntry] = deque(maxlen=500)

    async def register_dashboard(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self.dashboard_clients.add(websocket)
        await websocket.send_json(
            {
                "type": "snapshot",
                "controllers": [c.model_dump() for c in self.controllers()],
                "devices": [d.model_dump() for d in self.device_list()],
                "events": [e.model_dump() for e in self.event_list()],
            }
        )

    async def unregister_dashboard(self, websocket: WebSocket) -> None:
        async with self._lock:
            self.dashboard_clients.discard(websocket)

    async def register_controller(self, websocket: WebSocket, envelope: JsonAsgEnvelope) -> str:
        async with self._lock:
            controller_id = self.controllers_by_device_id.get(envelope.DeviceID)
            if controller_id is None:
                controller_id = f"controller-{self._next_controller_number}"
                self._next_controller_number += 1
                self.controllers_by_device_id[envelope.DeviceID] = controller_id
            self.controller_sockets[controller_id] = websocket
            self.controller_device_ids[controller_id] = envelope.DeviceID
            self.controller_last_activity[controller_id] = envelope.updated_at or utc_now()
        await self.log("success", "controller", f"{controller_id} connected", {"deviceId": envelope.DeviceID})
        await self.process_envelope(controller_id, envelope)
        return controller_id

    async def unregister_controller(self, controller_id: str) -> None:
        async with self._lock:
            self.controller_sockets.pop(controller_id, None)
            self.controller_last_activity[controller_id] = utc_now()
            for key, device in list(self.devices.items()):
                if key[0] == controller_id:
                    self.devices[key] = device.model_copy(update={"online": False, "last_update": utc_now()})
        await self.log("warning", "controller", f"{controller_id} disconnected")
        await self.broadcast_state("controller_offline")

    async def process_envelope(self, controller_id: str, envelope: JsonAsgEnvelope) -> None:
        timestamp = envelope.updated_at or utc_now()
        async with self._lock:
            self.controller_last_activity[controller_id] = timestamp
            self.controller_device_ids[controller_id] = envelope.DeviceID
            self.raw_envelopes.setdefault(controller_id, [])
            self.raw_envelopes[controller_id] = (self.raw_envelopes[controller_id] + [envelope.model_dump()])[-50:]
            if envelope.Type == "Realtime":
                self._update_devices_from_pumps(controller_id, envelope, timestamp)
        level = "status" if envelope.Type == "Realtime" else "success"
        await self.log(level, "jsonASG", f"{controller_id} {envelope.Type}", envelope.model_dump(), broadcast=False)
        await self.broadcast({"type": envelope.Type, "controller_id": controller_id, "envelope": envelope.model_dump()})
        await self.broadcast_state("state_update")

    def _update_devices_from_pumps(self, controller_id: str, envelope: JsonAsgEnvelope, timestamp: str) -> None:
        pumps = envelope.Packet.get("Pumps") or []
        for index, pump in enumerate(pumps):
            if not isinstance(pump, dict):
                continue
            raw_id = pump.get("device_id") or pump.get("DeviceID") or pump.get("PumpID") or pump.get("pump_id") or index + 1
            try:
                device_id = int(raw_id)
            except (TypeError, ValueError):
                continue
            pump_addr = pump.get("pump_addr")
            nozzle_id = pump.get("nozzle_id")
            nozzle = (
                pump.get("nozzle")
                or pump.get("Nozzle")
                or pump.get("pump_nozzle")
                or self._format_pump_nozzle(device_id, pump_addr, nozzle_id)
            )
            status = str(pump.get("status") or pump.get("Status") or self._pump_status_label(pump))
            fueling_state = str(pump.get("fueling_state") or pump.get("FuelingState") or self._fueling_state_label(pump))
            device = DeviceState(
                controller_id=controller_id,
                deviceId=envelope.DeviceID,
                device_id=device_id,
                pump=self._safe_int(pump_addr),
                nozzle=self._safe_int(nozzle_id),
                pump_nozzle=str(nozzle),
                status=status,
                nozzle_online=bool(pump.get("nozzle_online", True)),
                nozzle_lifted=bool(pump.get("nozzle_lifted", False)),
                data_error=bool(pump.get("data_error", False)),
                state=self._safe_int(pump.get("state")),
                preset_by_console=bool(pump.get("preset_by_console", False)),
                tx_available=bool(pump.get("tx_available", False)),
                current_sales=float(pump.get("current_sales") or pump.get("amount") or pump.get("Amount") or 0),
                current_volume=float(pump.get("current_volume") or pump.get("volume") or pump.get("Volume") or 0),
                unit_price=float(pump.get("unit_price") or pump.get("UnitPrice") or pump.get("price") or 0),
                sales_total=float(pump.get("sales_total") or 0),
                volume_total=float(pump.get("volume_total") or 0),
                fueling_state=fueling_state,
                last_update=timestamp,
                online=bool(pump.get("online", True)) and bool(pump.get("nozzle_online", True)),
            )
            self.devices[(controller_id, device_id)] = device

    def _safe_int(self, value: Any) -> int | None:
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    def _format_pump_nozzle(self, device_id: int, pump_addr: Any, nozzle_id: Any) -> str:
        if pump_addr is not None and nozzle_id is not None:
            return f"Pump {pump_addr} / Nozzle {nozzle_id}"
        if pump_addr is not None:
            return f"Pump {pump_addr}"
        return f"Pump {device_id}"

    def _pump_status_label(self, pump: dict[str, Any]) -> str:
        if not bool(pump.get("online", True)):
            return "disabled"
        if not bool(pump.get("nozzle_online", True)):
            return "nozzle_offline"
        if bool(pump.get("data_error", False)):
            return "data_error"
        if bool(pump.get("nozzle_lifted", False)):
            return "nozzle_lifted"
        state = pump.get("state")
        if state == 2:
            return "fueling_non_console"
        if state == 3:
            return "fueling_console"
        if state == 0:
            return "stop_unlock"
        if state == 1:
            return "stop_lock"
        return "unknown"

    def _fueling_state_label(self, pump: dict[str, Any]) -> str:
        state = pump.get("state")
        if state in {2, 3}:
            return "fueling"
        if bool(pump.get("nozzle_lifted", False)):
            return "nozzle_lifted"
        if state == 0:
            return "stopped_unlocked"
        if state == 1:
            return "stopped_locked"
        return self._pump_status_label(pump)

    def controllers(self) -> list[ControllerInfo]:
        result: list[ControllerInfo] = []
        for controller_id, device_id in self.controller_device_ids.items():
            result.append(
                ControllerInfo(
                    controller_id=controller_id,
                    deviceId=device_id,
                    online=controller_id in self.controller_sockets,
                    last_activity=self.controller_last_activity.get(controller_id, utc_now()),
                    pump_count=sum(1 for key in self.devices if key[0] == controller_id),
                )
            )
        return result

    def device_list(self) -> list[DeviceState]:
        return sorted(self.devices.values(), key=lambda item: (item.controller_id, item.device_id))

    def event_list(self) -> list[EventEntry]:
        return list(self.events)

    def raw_list(self, controller_id: str | None = None) -> dict[str, list[dict[str, Any]]]:
        if controller_id:
            return {controller_id: self.raw_envelopes.get(controller_id, [])}
        return self.raw_envelopes

    def get_device(self, controller_id: str, device_id: int) -> DeviceState | None:
        return self.devices.get((controller_id, device_id))

    async def send_command(self, controller_id: str, device_id: int, command: BrowserCommand) -> dict[str, Any]:
        websocket = self.controller_sockets.get(controller_id)
        if websocket is None:
            await self.log("error", "command", f"{controller_id} is offline")
            raise ValueError("controller is offline")
        payload = self._translate_command(device_id, command)
        await websocket.send_json(payload)
        await self.log("success", "command", f"sent {payload['command']} to {controller_id}/{device_id}", payload)
        return payload

    def _translate_command(self, device_id: int, command: BrowserCommand) -> dict[str, Any]:
        params = command.params
        base: dict[str, Any] = {"type": "command", "device_id": device_id}
        if command.action == "start":
            return base | {"command": "START"}
        if command.action == "stop":
            return base | {"command": "STOP"}
        if command.action == "preset":
            mode = params.get("mode")
            value = params.get("value")
            if mode not in {"amount", "volume"} or value is None:
                raise ValueError("preset requires mode amount|volume and value")
            return base | {"command": "PRESET", "mode": mode, "value": value}
        if command.action == "setPrice":
            price = params.get("price")
            if price is None:
                raise ValueError("setPrice requires price")
            return base | {"command": "SET_PRICE", "value": price}
        if command.action == "setDateTime":
            return base | {"command": "SET_DATETIME"}
        if command.action == "deleteTransaction":
            return base | {"command": "DELETE_TRANSACTION"}
        if command.action == "setMonitorMode":
            monitor_mode = params.get("monitorMode")
            if monitor_mode is None:
                raise ValueError("setMonitorMode requires monitorMode")
            return base | {"command": "SET_MONITOR_MODE", "monitorMode": monitor_mode}
        if command.action == "cancelPreset":
            sequence = params.get("sequence")
            if sequence is None:
                raise ValueError("cancelPreset requires sequence")
            return base | {"command": "CANCEL_PRESET", "sequence": sequence}
        raise ValueError("unsupported command")

    async def log(
        self,
        level: str,
        source: str,
        message: str,
        data: dict[str, Any] | None = None,
        broadcast: bool = True,
    ) -> None:
        event = EventEntry(ts=utc_now(), level=level, source=source, message=message, data=data)
        async with self._lock:
            self.events.append(event)
        if broadcast:
            await self.broadcast({"type": "event", "event": event.model_dump()})

    async def broadcast_state(self, reason: str) -> None:
        await self.broadcast(
            {
                "type": reason,
                "controllers": [c.model_dump() for c in self.controllers()],
                "devices": [d.model_dump() for d in self.device_list()],
            }
        )

    async def broadcast(self, payload: dict[str, Any]) -> None:
        disconnected: list[WebSocket] = []
        async with self._lock:
            clients = list(self.dashboard_clients)
        for client in clients:
            try:
                await client.send_json(payload)
            except Exception:
                disconnected.append(client)
        if disconnected:
            async with self._lock:
                for client in disconnected:
                    self.dashboard_clients.discard(client)


manager = SessionManager()
