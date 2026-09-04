from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import hotspots as hs
from app.services.scenario_engine import engine

router = APIRouter(prefix="/api/hotspots", tags=["hotspots"])


class CreateHotspotBody(BaseModel):
    type: str
    lat: float
    lon: float
    capacity: int
    notes: str = ""


class UpdateHotspotBody(BaseModel):
    owner_token: str
    capacity: int | None = None
    occupancy: int | None = None
    status: str | None = None


def _zones_by_id() -> dict[str, dict]:
    return {z["zone_id"]: z for z in engine.state().get("zones", [])}


@router.get("")
def list_hotspots(zone_id: str | None = None, only_available: bool = False):
    zones_by_id = _zones_by_id()
    items = [hs.serialize(h, zones_by_id, relative_to_zone_id=zone_id) for h in hs.store.all() if h.status == "OPEN"]
    if only_available:
        items = [i for i in items if i["available"] > 0 and i["safety"] != "UNSAFE"]
    if zone_id:
        items.sort(key=lambda i: (i["distance_km"] is None, i["distance_km"]))
    return {"hotspots": items}


@router.post("")
def create_hotspot(body: CreateHotspotBody):
    if body.capacity < 1 or body.capacity > 5000:
        raise HTTPException(status_code=400, detail="capacity must be between 1 and 5000")
    h = hs.store.create(body.type, body.lat, body.lon, body.capacity, body.notes)
    zones_by_id = _zones_by_id()
    return {"hotspot": hs.serialize(h, zones_by_id), "owner_token": h.owner_token}


@router.patch("/{hotspot_id}")
def update_hotspot(hotspot_id: str, body: UpdateHotspotBody):
    h = hs.store.update(hotspot_id, body.owner_token, capacity=body.capacity, occupancy=body.occupancy, status=body.status)
    if h is None:
        raise HTTPException(status_code=404, detail="Hotspot not found or owner token does not match")
    zones_by_id = _zones_by_id()
    return {"hotspot": hs.serialize(h, zones_by_id)}


@router.get("/{hotspot_id}")
def get_hotspot(hotspot_id: str):
    h = hs.store.get(hotspot_id)
    if h is None:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    zones_by_id = _zones_by_id()
    return {"hotspot": hs.serialize(h, zones_by_id)}
