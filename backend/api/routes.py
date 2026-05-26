from fastapi import APIRouter, HTTPException
from models.schemas import BrowserCommand
from services.session_manager import manager

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/controllers")
async def controllers():
    return [controller.model_dump() for controller in manager.controllers()]


@router.get("/devices")
async def devices():
    return [device.model_dump() for device in manager.device_list()]


@router.get("/events")
async def events():
    return [event.model_dump() for event in manager.event_list()]


@router.get("/raw")
async def raw():
    return manager.raw_list()


@router.get("/controllers/{controller_id}/raw")
async def controller_raw(controller_id: str):
    if controller_id not in manager.controller_device_ids:
        raise HTTPException(status_code=404, detail="controller not found")
    return manager.raw_list(controller_id)


@router.get("/controllers/{controller_id}/devices/{device_id}")
async def device_detail(controller_id: str, device_id: int):
    device = manager.get_device(controller_id, device_id)
    if device is None:
        raise HTTPException(status_code=404, detail="device not found")
    return device.model_dump()


@router.post("/controllers/{controller_id}/devices/{device_id}/commands")
async def send_command(controller_id: str, device_id: int, command: BrowserCommand):
    try:
        payload = await manager.send_command(controller_id, device_id, command)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "sent": payload}
