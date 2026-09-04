from __future__ import annotations

from fastapi import APIRouter

from app.services.scenario_engine import engine

router = APIRouter(prefix="/api/flood", tags=["flood"])


@router.get("/status")
def flood_status():
    state = engine.state()
    return {
        "scenario": state.get("scenario"),
        "breach_stage": state.get("breach_stage"),
        "sim_minutes": state.get("sim_minutes"),
        "model_type": "DEMO spatial propagation model (not a validated hydrodynamic simulation)",
    }


@router.get("/zones")
def flood_zones():
    state = engine.state()
    return {"zones": state.get("zones", [])}
