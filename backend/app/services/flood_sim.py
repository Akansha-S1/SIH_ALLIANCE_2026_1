"""
DEMO flood propagation model (section 14).

IMPORTANT: this is a simplified spatial/temporal propagation model built
for prototype demonstration. It is NOT a validated 2D hydrodynamic model
(no HEC-RAS / shallow-water-equations solve). It uses each zone's distance
from the dam + a configurable wave-speed/attenuation model to estimate
arrival time, depth and velocity, and is intended to visibly and
plausibly expand downstream on breach the way a real flood would --
suitable for a live demo, not for real flood-risk certification.
"""
from __future__ import annotations

import math

from app.config import band_label, settings

BASE_DEPTH_M = {1: 2.6, 2: 6.0}  # partial vs major breach, depth at the dam toe

ZONE_RISK_BANDS = [
    {"min": 0, "max": 24, "label": "NORMAL"},
    {"min": 25, "max": 49, "label": "MONITOR"},
    {"min": 50, "max": 74, "label": "WARNING"},
    {"min": 75, "max": 89, "label": "HIGH"},
    {"min": 90, "max": 100, "label": "CRITICAL"},
]


def _band(score: float) -> str:
    return band_label(score, ZONE_RISK_BANDS)


def simulate_zones(zones: list[dict], breach_stage: int, breach_onset_min: float, sim_minutes: float, failure_risk_score: float) -> list[dict]:
    fm = settings.flood_model
    out = []

    for z in zones:
        distance = z["distance_from_dam_km"]

        if breach_stage == 0:
            baseline_risk = round(min(20.0, failure_risk_score * 0.15), 1)
            out.append(
                {
                    "zone_id": z["zone_id"],
                    "name": z["name"],
                    "lat": z["lat"],
                    "lon": z["lon"],
                    "population": z["population"],
                    "exposed_population": 0,
                    "flood_depth_m": 0.0,
                    "flood_velocity_mps": 0.0,
                    "arrival_time_min": None,
                    "risk_score": baseline_risk,
                    "status": _band(baseline_risk),
                    "evacuation_status": "SAFE",
                }
            )
            continue

        multiplier = fm["partial_breach_multiplier"] if breach_stage == 1 else fm["major_breach_multiplier"]
        projected_depth = BASE_DEPTH_M[breach_stage] * multiplier * math.exp(-0.028 * distance)

        if projected_depth < 0.25:
            baseline_risk = round(min(15.0, failure_risk_score * 0.1), 1)
            out.append(
                {
                    "zone_id": z["zone_id"],
                    "name": z["name"],
                    "lat": z["lat"],
                    "lon": z["lon"],
                    "population": z["population"],
                    "exposed_population": 0,
                    "flood_depth_m": 0.0,
                    "flood_velocity_mps": 0.0,
                    "arrival_time_min": None,
                    "risk_score": baseline_risk,
                    "status": _band(baseline_risk),
                    "evacuation_status": "SAFE",
                }
            )
            continue

        avg_speed_kmph = max(
            fm["base_wave_speed_kmph"] * 0.25,
            fm["base_wave_speed_kmph"] * multiplier * (1 - fm["attenuation_per_km"] * distance),
        )
        arrival_time_min = round((distance / avg_speed_kmph) * 60, 1)

        elapsed = max(0.0, sim_minutes - breach_onset_min) if breach_onset_min >= 0 else 0.0
        rise_progress = max(0.0, min(1.0, (elapsed - arrival_time_min) / 10.0))
        current_depth = round(projected_depth * rise_progress, 2)
        velocity = round(1.9 * multiplier * math.exp(-0.024 * distance) * (0.4 + 0.6 * rise_progress), 2) if rise_progress > 0 else 0.0

        exposed_population = int(round(z["population"] * min(1.0, 0.35 + projected_depth / 6)))

        time_to_arrival = arrival_time_min - elapsed
        urgency = max(0.0, min(1.0, 1 - time_to_arrival / 60))
        depth_factor = max(0.0, min(1.0, projected_depth / 5))
        risk_score = round(100 * (0.55 * depth_factor + 0.45 * urgency), 1)

        if elapsed >= arrival_time_min:
            evac_status = "FLOODED"
        elif time_to_arrival <= 30:
            evac_status = "EVACUATING"
        elif time_to_arrival <= 60:
            evac_status = "MONITOR"
        else:
            evac_status = "SAFE"

        out.append(
            {
                "zone_id": z["zone_id"],
                "name": z["name"],
                "lat": z["lat"],
                "lon": z["lon"],
                "population": z["population"],
                "exposed_population": exposed_population,
                "flood_depth_m": current_depth,
                "flood_velocity_mps": velocity,
                "arrival_time_min": arrival_time_min,
                "risk_score": risk_score,
                "status": _band(risk_score),
                "evacuation_status": evac_status,
            }
        )

    return out


def flood_depth_at_road(road: dict, zone_states: dict[str, dict], zones_by_id: dict[str, dict]) -> float:
    """
    Estimate flood depth submerging a road (demo heuristic, elevation-aware): for each
    endpoint that is a flood zone, project a local flood *water-surface elevation*
    (zone ground elevation + current flood depth at that zone) and compare it against
    the road's own minimum elevation along its route. A road only floods once the
    projected water surface rises above its lowest point -- so a highland evacuation
    road climbing well above the valley floor correctly stays passable while a
    riverside/valley road at similar or lower elevation floods first.
    """
    water_surface_elevations = []
    for node in (road["start_node"], road["end_node"]):
        zstate = zone_states.get(node)
        zgeo = zones_by_id.get(node)
        if zstate and zgeo and zstate["flood_depth_m"] > 0:
            water_surface_elevations.append(zgeo["elevation_m"] + zstate["flood_depth_m"])

    if not water_surface_elevations:
        return 0.0

    submersion = max(0.0, max(water_surface_elevations) - road["min_elevation_m"])
    if road.get("is_bridge") and submersion > 0:
        submersion *= 1.15  # bridges/river crossings flood a little deeper than the surrounding road
    return round(submersion, 2)
