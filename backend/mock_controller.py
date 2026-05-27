import asyncio
import json
import random
from datetime import datetime, timezone

import websockets


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S%z")


def realtime(volume: float, amount: float) -> dict:
    return {
        "Protocol": "jsonASG",
        "DeviceID": "Pi4 | S/N: 10000000629f5838",
        "Type": "Realtime",
        "Packet": {
            "Pumps": [
                {
                    "device_id": 201,
                    "pump_addr": 2,
                    "nozzle_id": 1,
                    "port_id": 1,
                    "protocol": "censtar",
                    "online": True,
                    "nozzle_online": True,
                    "nozzle_lifted": volume > 0,
                    "data_error": False,
                    "state": 2 if volume > 0 else 1,
                    "preset_by_console": False,
                    "tx_available": True,
                    "display_mode": 6,
                    "current_sales": round(amount, 2),
                    "current_volume": round(volume, 2),
                    "unit_price": 55.55,
                    "sales_total": 100.0 + round(amount, 2),
                    "volume_total": 10.0 + round(volume, 2),
                    "tag": "",
                },
                {
                    "device_id": 202,
                    "pump_addr": 3,
                    "nozzle_id": 1,
                    "port_id": 1,
                    "protocol": "censtar",
                    "online": True,
                    "nozzle_online": True,
                    "nozzle_lifted": False,
                    "data_error": False,
                    "state": 1,
                    "preset_by_console": False,
                    "tx_available": False,
                    "display_mode": 6,
                    "current_sales": 0.0,
                    "current_volume": 0.0,
                    "unit_price": 55.55,
                    "sales_total": 50.0,
                    "volume_total": 5.0,
                    "tag": "",
                },
            ],
            "Probes": [],
        },
        "updated_at": now(),
    }


async def receiver(ws) -> None:
    async for message in ws:
        print("received command:", message)
        response = {
            "Protocol": "jsonASG",
            "DeviceID": "Pi4 | S/N: 10000000629f5838",
            "Type": json.loads(message).get("command", "COMMAND_RESPONSE"),
            "Packet": {
                "event": [
                    {
                        "category": "command_response",
                        "event": "COMMAND_RESPONSE",
                        "level": "info",
                        "device_id": json.loads(message).get("device_id", 201),
                        "pump_addr": 2,
                        "nozzle_id": 1,
                        "command": json.loads(message).get("command", ""),
                        "response_code": "03H",
                        "success": True,
                        "message": "success",
                        "error_code": "",
                        "occurred_at": now(),
                    }
                ]
            },
            "updated_at": now(),
        }
        await ws.send(json.dumps(response))


async def sender(ws) -> None:
    volume = 0.0
    while True:
        volume += random.uniform(0.05, 0.3)
        await ws.send(json.dumps(realtime(volume, volume * 52.47)))
        if random.random() > 0.82:
            event = {
                "Protocol": "jsonASG",
                "DeviceID": "Pi4 | S/N: 10000000629f5838",
                "Type": "DISPENSER_ERROR",
                "Packet": {
                    "event": [
                        {
                            "category": "dispenser",
                            "event": "DISPENSER_ERROR",
                            "level": "error",
                            "error_code": "DISPENSER_TIMEOUT",
                            "message": "dispenser_response_timeout",
                            "device_id": 201,
                            "pump_addr": 2,
                            "nozzle_id": 1,
                            "command": "34H",
                            "occurred_at": now(),
                        }
                    ]
                },
                "updated_at": now(),
            }
            await ws.send(json.dumps(event))
        await asyncio.sleep(2)


async def main() -> None:
    uri = "ws://localhost:8000/ws/controller"
    async with websockets.connect(uri) as ws:
        await asyncio.gather(sender(ws), receiver(ws))


if __name__ == "__main__":
    asyncio.run(main())
