from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.services.geo import roads_with_geometry
from app.services.scenario_engine import engine

router = APIRouter(tags=["geo"])


@router.get("/api/zones")
def zones():
    return {"zones": settings.zones}


@router.get("/api/shelters")
def shelters():
    state = engine.state()
    return {"shelters": state.get("shelters", [])}


@router.get("/api/roads")
def roads():
    state = engine.state()
    geom = {r["road_id"]: r["coordinates"] for r in roads_with_geometry()}
    roads_out = []
    for r in state.get("roads", []):
        roads_out.append({**r, "coordinates": geom.get(r["road_id"], [])})
    return {"roads": roads_out}


@router.get("/api/infrastructure")
def infrastructure():
    return {"infrastructure": settings.infrastructure}


@router.get("/api/geo/dam")
def geo_dam():
    return settings.dam


@router.get("/api/routes")
def routes(zone_id: str):
    from app.services.routing import build_road_states, find_routes
    from app.services.flood_sim import flood_depth_at_road

    state = engine.state()
    zone_by_id = {z["zone_id"]: z for z in state.get("zones", [])}
    z = zone_by_id.get(zone_id)
    if not z or not z.get("recommended_shelter"):
        return {"zone_id": zone_id, "routes": None, "message": "No active evacuation route for this zone"}

    zones_by_id = {z["zone_id"]: z for z in settings.zones}
    depth_by_road = {r["road_id"]: flood_depth_at_road(r, zone_by_id, zones_by_id) for r in settings.roads}
    road_states = build_road_states(settings.roads, depth_by_road)
    target = z["recommended_route"][-1] if z.get("recommended_route") else None
    if not target:
        return {"zone_id": zone_id, "routes": None}
    routes = find_routes(road_states, zone_id, target)
    return {"zone_id": zone_id, "target_shelter": target, "routes": routes}
