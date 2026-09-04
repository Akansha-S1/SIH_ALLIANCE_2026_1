"""Static geospatial reference helpers shared by API routes (feeds the CesiumJS digital twin)."""
from __future__ import annotations

from app.config import settings


def node_coords() -> dict[str, dict]:
    nodes: dict[str, dict] = {
        settings.dam["id"]: {"lat": settings.dam["lat"], "lon": settings.dam["lon"], "type": "dam"},
    }
    for z in settings.zones:
        nodes[z["zone_id"]] = {"lat": z["lat"], "lon": z["lon"], "type": "zone"}
    for s in settings.shelters:
        nodes[s["shelter_id"]] = {"lat": s["lat"], "lon": s["lon"], "type": "shelter"}
    return nodes


def roads_with_geometry() -> list[dict]:
    nodes = node_coords()
    out = []
    for r in settings.roads:
        a = nodes.get(r["start_node"])
        b = nodes.get(r["end_node"])
        if not a or not b:
            continue
        out.append({**r, "coordinates": [[a["lon"], a["lat"]], [b["lon"], b["lat"]]]})
    return out
