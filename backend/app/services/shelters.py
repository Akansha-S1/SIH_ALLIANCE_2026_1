"""Shelter Engine (section 20) - state + recommendation logic."""
from __future__ import annotations

from app.services.routing import find_routes


def build_shelter_states(shelters: list[dict], zone_risk_by_id: dict[str, dict]) -> list[dict]:
    states = []
    for s in shelters:
        available = s["capacity"] - s["occupancy"]
        # demo heuristic: shelters sit on high ground; only mark elevated risk if the
        # nearest zone is under CRITICAL flood risk (extreme scenario, conservative flag)
        near_zone_critical = any(
            zr["status"] == "CRITICAL" and zr.get("risk_score", 0) >= 92 for zr in zone_risk_by_id.values()
        )
        flood_risk = "MONITOR" if near_zone_critical else "LOW"
        status = "ACCEPTING EVACUEES" if available > 0 else "FULL"
        states.append(
            {
                "shelter_id": s["shelter_id"],
                "name": s["name"],
                "lat": s["lat"],
                "lon": s["lon"],
                "capacity": s["capacity"],
                "occupancy": s["occupancy"],
                "available": available,
                "flood_risk": flood_risk,
                "status": status,
            }
        )
    return states


def recommend_shelter_for_zone(zone_id: str, shelter_states: list[dict], road_states: list[dict]) -> dict | None:
    best = None
    for sh in shelter_states:
        if sh["available"] <= 0:
            continue
        routes = find_routes(road_states, zone_id, sh["shelter_id"])
        route = routes.get("recommended") or routes.get("current")
        if not route:
            continue
        risk_penalty = 0 if sh["flood_risk"] == "LOW" else 20
        capacity_bonus = 0 if sh["available"] > 300 else 8
        score = route["travel_time_min"] + risk_penalty + capacity_bonus
        candidate = {
            "shelter_id": sh["shelter_id"],
            "shelter_name": sh["name"],
            "travel_time_min": route["travel_time_min"],
            "route_nodes": route["nodes"],
            "route_road_ids": route["road_ids"],
            "score": round(score, 1),
        }
        if best is None or candidate["score"] < best["score"]:
            best = candidate
    return best
