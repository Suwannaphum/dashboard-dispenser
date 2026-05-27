from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class JsonAsgEnvelope(BaseModel):
    Protocol: str
    DeviceID: str
    Type: str
    Packet: dict[str, Any] = Field(default_factory=dict)
    updated_at: str | None = None


class ControllerInfo(BaseModel):
    controller_id: str
    deviceId: str
    online: bool
    last_activity: str
    pump_count: int = 0


class DeviceState(BaseModel):
    controller_id: str
    deviceId: str
    device_id: int
    pump: int | None = None
    nozzle: int | None = None
    pump_nozzle: str
    status: str
    nozzle_online: bool = False
    nozzle_lifted: bool = False
    data_error: bool = False
    state: int | None = None
    preset_by_console: bool = False
    tx_available: bool = False
    current_sales: float
    current_volume: float
    unit_price: float
    sales_total: float
    volume_total: float
    fueling_state: str
    last_update: str
    online: bool

    @property
    def volume(self) -> float:
        return self.current_volume

    @property
    def amount(self) -> float:
        return self.current_sales


class EventEntry(BaseModel):
    ts: str
    level: Literal["success", "warning", "error", "status", "info"]
    source: str
    message: str
    data: dict[str, Any] | None = None


class BrowserCommand(BaseModel):
    action: Literal[
        "start",
        "stop",
        "preset",
        "setPrice",
        "setDateTime",
        "deleteTransaction",
        "setMonitorMode",
        "cancelPreset",
    ]
    params: dict[str, Any] = Field(default_factory=dict)
