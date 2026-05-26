# Industrial Fuel Dispenser Dashboard v1 Plan

Build a v1 industrial fuel dispenser dashboard platform compatible with the new outbound-controller architecture using `api.main2.py`.

## Architecture Overview

Pi4 controllers:

* Run `api.main2.py`
* Connect outbound to the dashboard backend over WebSocket
* Do NOT expose `/ws/status`
* Do NOT require browser/LAN dashboard access

Run command on Pi4:

venv/bin/uvicorn api.main2:app --host 127.0.0.1 --port 8080

System architecture:

daemon UDP
|
v
Pi4 api.main2
|
| outbound WebSocket
v
Dashboard Backend (/ws/controller)
|
| HTTP + WebSocket
v
Browser Dashboard UI

## Tech Stack

Frontend:

* Next.js App Router
* TypeScript
* Tailwind CSS
* Zustand
* Native WebSocket API
* TanStack Table
* Dark industrial UI

Backend:

* FastAPI
* Asyncio
* WebSocket
* In-memory controller/device session manager

Style:

* industrial control dashboard
* SCADA-lite inspired
* terminal monitoring UI
* compact layout
* realtime-first
* dark mode
* low latency

---

# IMPORTANT ARCHITECTURE RULES

* Browser never connects directly to Pi4
* Browser never uses Pi4 localhost/127.0.0.1
* Pi4 connects outbound to Dashboard Backend
* Dashboard Backend acts as WebSocket server for controllers
* Dashboard Backend owns mirrored realtime state
* Dashboard Backend relays commands to Pi4 controllers

---

# Realtime Controller WebSocket

Dashboard Backend endpoint:

/ws/controller

Pi4 api.main2 connects to this endpoint and sends jsonASG envelopes directly.

## Realtime Status Envelope

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

## Event Envelope

{
"Protocol": "jsonASG",
"DeviceID": "Pi4 | S/N: 10000000629f5838",
"Type": "Event",
"Packet": {
"Events": []
},
"updated_at": "2026-05-26T10:00:00Z"
}

## Command Response Envelope

{
"Protocol": "jsonASG",
"DeviceID": "Pi4 | S/N: 10000000629f5838",
"Type": "CommandResponse",
"Packet": {
"CommandResponses": []
},
"updated_at": "2026-05-26T10:00:00Z"
}

---

# Dashboard Backend Requirements

## WebSocket Endpoints

/ws/controller
/ws/dashboard

## Required Backend Behavior

* Accept outbound Pi4 WebSocket connections
* Store controller sessions in memory
* Store latest device states in memory
* Broadcast realtime updates to browser dashboards
* Mark disconnected controllers as offline
* Keep last-known controller/device state in memory
* Optionally prune stale offline controllers later
* Treat WebSocket activity as heartbeat for v1
* Relay browser commands to the correct Pi4 controller
* Log command results and events
* Handle reconnects automatically

---

# Controller Identification

Do NOT use raw DeviceID directly in URL paths.

Example raw DeviceID:
Pi4 | S/N: 10000000629f5838

Backend should generate safe controller IDs:

controller-1
controller-2
controller-3

Store mapping:

{
"controller_id": "controller-1",
"deviceId": "Pi4 | S/N: 10000000629f5838"
}

All frontend/backend APIs should use:

* controller_id for routing
* deviceId only for display/debug

---

# Browser Dashboard Features

## Main Dashboard

Show:

* connected controllers
* online/offline state
* last activity timestamp
* connected pumps/nozzles
* realtime updates without refresh

## Device Cards/Table

Show:

* controller_id
* deviceId
* device_id
* pump/nozzle
* status
* volume
* amount
* unit_price
* fueling state
* last_update
* online/offline

---

# Browser Command API

Browser sends commands to Dashboard Backend HTTP API.

Recommended endpoint:

POST /controllers/{controller_id}/devices/{device_id}/commands

## Browser Command Payloads

START:
{"action":"start"}

STOP:
{"action":"stop"}

PRESET amount:
{"action":"preset","params":{"mode":"amount","value":150}}

PRESET volume:
{"action":"preset","params":{"mode":"volume","value":10}}

SET_PRICE:
{"action":"setPrice","params":{"price":52.47}}

SET_DATETIME:
{"action":"setDateTime"}

DELETE_TRANSACTION:
{"action":"deleteTransaction"}

SET_MONITOR_MODE:
{"action":"setMonitorMode","params":{"monitorMode":85}}

CANCEL_PRESET:
{"action":"cancelPreset","params":{"sequence":1}}

---

# Pi Controller WebSocket Command Format

Dashboard Backend converts browser commands into Pi command format.

Examples:

START:
{"type":"command","device_id":201,"command":"START"}

STOP:
{"type":"command","device_id":201,"command":"STOP"}

PRESET amount:
{"type":"command","device_id":201,"command":"PRESET","mode":"amount","value":150}

PRESET volume:
{"type":"command","device_id":201,"command":"PRESET","mode":"volume","value":10}

SET_PRICE:
{"type":"command","device_id":201,"command":"SET_PRICE","value":52.47}

SET_DATETIME:
{"type":"command","device_id":201,"command":"SET_DATETIME"}

DELETE_TRANSACTION:
{"type":"command","device_id":201,"command":"DELETE_TRANSACTION"}

SET_MONITOR_MODE:
{"type":"command","device_id":201,"command":"SET_MONITOR_MODE","monitorMode":85}

CANCEL_PRESET:
{"type":"command","device_id":201,"command":"CANCEL_PRESET","sequence":1}

---

# Device Detail API

Add detail endpoint:

GET /controllers/{controller_id}/devices/{device_id}

Reason:

* device_id may only be unique per controller
* multi-controller routing should stay explicit

---

# Raw Debug Endpoints

Normalized devices endpoint:

GET /devices

Raw envelope debug endpoints:

GET /raw

Optional:
GET /controllers/{controller_id}/raw

Important:

* raw endpoints return raw jsonASG envelopes
* NOT raw daemon UDP packets

---

# Terminal/Event Panel

Create terminal-like realtime panel:

* realtime event stream
* raw jsonASG envelope viewer
* command send results
* auto-scroll
* clear terminal button

Color rules:

* green = success
* yellow = warning
* red = error
* blue = realtime status

---

# Frontend Data Loading

On page load:

* call GET /devices
* populate initial Zustand/device state
* connect to /ws/dashboard for realtime updates

No browser refresh required.

---

# Backend HTTP API

Required:

GET /health
GET /controllers
GET /devices
GET /events

Optional detail:
GET /controllers/{controller_id}/devices/{device_id}

Optional raw/debug:
GET /raw
GET /controllers/{controller_id}/raw

---

# Mock Controller Requirements

Create a mock controller for development/testing.

Mock controller must:

* connect to:
  ws://localhost:<backend-port>/ws/controller
* send jsonASG envelopes
* simulate realtime device updates
* simulate events
* receive command messages from backend
* print received commands

---

# v1 Scope Decisions

Included in v1:

* realtime dashboard
* realtime command relay
* controller/device state mirroring
* event stream
* raw jsonASG debug view

NOT included in v1:

* direct Pi config management
* Pi HTTP config proxying
* historical Pi log file proxying
* raw daemon UDP packet exposure
* advanced auth/permissions
* suspend/resume/authorize/emergency_stop

Heartbeat:

* based on WebSocket connection/activity only

---

# File Structure

frontend/
app/
components/
hooks/
stores/
lib/

backend/
api/
websocket/
models/
services/

---

# Additional Requirements

* Use TypeScript wherever possible
* Use reusable React components
* Keep implementation simple and readable
* Keep UI responsive
* Include example mock realtime data
* Include sample WebSocket messages
* Include run instructions
* Provide full runnable code
