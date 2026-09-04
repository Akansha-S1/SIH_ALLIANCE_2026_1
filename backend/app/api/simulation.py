from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.scenario_engine import SCENARIOS, engine

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


class ScenarioBody(BaseModel):
    scenario: str


class SpeedBody(BaseModel):
    speed: float


@router.get("/state")
def simulation_state():
    return engine.state()


@router.get("/scenarios")
def list_scenarios():
    return {"scenarios": SCENARIOS, "current": engine.scenario}


@router.post("/start")
def start():
    engine.set_running(True)
    return {"running": engine.running}


@router.post("/pause")
def pause():
    engine.set_running(False)
    return {"running": engine.running}


@router.post("/reset")
def reset():
    engine.reset()
    return {"status": "reset"}


@router.post("/scenario")
def set_scenario(body: ScenarioBody):
    try:
        engine.set_scenario(body.scenario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"scenario": engine.scenario}


@router.post("/speed")
def set_speed(body: SpeedBody):
    engine.set_speed(body.speed)
    return {"speed": engine.speed}
