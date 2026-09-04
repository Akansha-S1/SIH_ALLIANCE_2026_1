"""
JALRAKSHAK AI - Backend entrypoint.

AI-Powered Dam Structural Health Monitoring, Dam-Break Flood Prediction,
Time-to-Safety, Dynamic Evacuation and Emergency Response System.

Runs entirely in DEMO MODE using simulated sensor data and local JSON/GeoJSON
reference data -- no external database, API keys, or hardware required.
See ../docs/DEMO.md for how to run and ../docs/ARCHITECTURE.md for the
full pipeline design.
"""
from __future__ import annotations

import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, analytics, dam, flood, geo_zones, simulation
from app.services.scenario_engine import engine
from app.websocket.manager import manager


async def _broadcast(state: dict) -> None:
    await manager.broadcast(state)


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine.set_broadcast(_broadcast)
    engine.tick()
    await engine.start_loop()
    yield


app = FastAPI(
    title="JALRAKSHAK AI",
    description="Dam Structural Health Monitoring, Dam-Break Flood Prediction & Emergency Response — DEMO MODE",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dam.router)
app.include_router(flood.router)
app.include_router(geo_zones.router)
app.include_router(alerts.router)
app.include_router(simulation.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "system": "JALRAKSHAK AI",
        "status": "OPERATIONAL",
        "mode": "DEMO / SIMULATED SENSOR DATA",
        "docs": "/docs",
        "websocket": "/ws/live",
    }


@app.get("/api/health")
def api_health():
    return {"status": "ok"}


@app.websocket("/ws/live")
async def ws_live(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_text(json.dumps(engine.state(), default=str))
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
