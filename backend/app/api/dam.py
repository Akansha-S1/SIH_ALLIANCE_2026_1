from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.services.scenario_engine import engine

router = APIRouter(prefix="/api/dam", tags=["dam"])


@router.get("/status")
def dam_status():
    state = engine.state()
    return {
        "dam": settings.dam,
        "summary": state.get("summary"),
        "scenario": state.get("scenario"),
        "breach_stage": state.get("breach_stage"),
        "sim_minutes": state.get("sim_minutes"),
        "data_source": "DEMO / SIMULATED SENSOR DATA",
    }


@router.get("/sensors")
def dam_sensors():
    state = engine.state()
    return {"sensors": state.get("sensors", []), "data_source": "DEMO / SIMULATED SENSOR DATA"}


@router.get("/health")
def dam_health():
    state = engine.state()
    return state.get("dam_health")


@router.get("/risk")
def dam_risk():
    state = engine.state()
    return state.get("failure_risk")


@router.get("/anomalies")
def dam_anomalies():
    state = engine.state()
    return {"anomalies": state.get("anomalies", [])}
