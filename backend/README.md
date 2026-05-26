# Dashboard Backend

FastAPI backend for the v1 outbound-controller architecture.

## Run

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Mock Controller

In another terminal:

```powershell
.\\.venv\\Scripts\\Activate.ps1
python mock_controller.py
```

The real Pi4 controller runs:

```bash
venv/bin/uvicorn api.main2:app --host 127.0.0.1 --port 8080
```

The Pi4 should connect outbound to:

```text
ws://<dashboard-backend-host>:8000/ws/controller
```

## HTTP API

- `GET /health`
- `GET /controllers`
- `GET /devices`
- `GET /events`
- `GET /raw`
- `GET /controllers/{controller_id}/raw`
- `GET /controllers/{controller_id}/devices/{device_id}`
- `POST /controllers/{controller_id}/devices/{device_id}/commands`

## Browser Command Example

```json
{"action":"preset","params":{"mode":"amount","value":150}}
```

The backend relays it to the Pi4 as:

```json
{"type":"command","device_id":201,"command":"PRESET","mode":"amount","value":150}
```
