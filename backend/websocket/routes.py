from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from models.schemas import JsonAsgEnvelope
from pydantic import ValidationError
from services.session_manager import manager

router = APIRouter()


@router.websocket("/ws/controller")
async def controller_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    controller_id: str | None = None
    try:
        while True:
            data = await websocket.receive_json()
            try:
                envelope = JsonAsgEnvelope.model_validate(data)
            except ValidationError as exc:
                await manager.log("error", "controller", "invalid jsonASG envelope", {"errors": exc.errors()})
                continue
            if controller_id is None:
                controller_id = await manager.register_controller(websocket, envelope)
            else:
                await manager.process_envelope(controller_id, envelope)
    except WebSocketDisconnect:
        if controller_id:
            await manager.unregister_controller(controller_id)


@router.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket) -> None:
    await manager.register_dashboard(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.unregister_dashboard(websocket)
