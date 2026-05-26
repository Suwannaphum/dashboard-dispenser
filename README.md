# Industrial Fuel Dispenser Dashboard v1

Production-style v1 dashboard platform for the outbound-controller architecture.

## Architecture

```text
daemon UDP
  -> Pi4 api.main2
  -> outbound WebSocket
  -> Dashboard Backend /ws/controller
  -> HTTP + WebSocket
  -> Browser Dashboard UI
```

The browser never connects directly to Pi4 or Pi4 `127.0.0.1`.

## Run Backend

```powershell
cd backend
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Run Mock Controller

```powershell
cd backend
.\\.venv\\Scripts\\Activate.ps1
python mock_controller.py
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Pi4 Runtime

```bash
venv/bin/uvicorn api.main2:app --host 127.0.0.1 --port 8080
```

The Pi4 controller should connect outbound to the dashboard backend:

```text
ws://<dashboard-host>:8000/ws/controller
```

## Example jsonASG Envelope

```json
{
  "Protocol": "jsonASG",
  "DeviceID": "Pi4 | S/N: 10000000629f5838",
  "Type": "Realtime",
  "Packet": {
    "Pumps": [],
    "Probes": []
  },
  "updated_at": "2026-05-26T10:00:00Z"
}
```

## Example Browser Command

```http
POST /controllers/controller-1/devices/201/commands
```

```json
{"action":"start"}
```

Backend relays:

```json
{"type":"command","device_id":201,"command":"START"}
```
