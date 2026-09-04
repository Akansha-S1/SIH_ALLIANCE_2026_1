from __future__ import annotations

from fastapi import APIRouter

from app.services.event_log import event_log
from app.services.scenario_engine import engine

router = APIRouter(tags=["alerts"])


@router.get("/api/alerts")
def alerts():
    state = engine.state()
    return {"alerts": state.get("alerts", [])}


@router.get("/api/events")
def events(limit: int = 100):
    return {"events": event_log.recent(limit)}
