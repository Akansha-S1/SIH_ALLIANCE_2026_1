"""Historical analytics endpoint (section 29). DEMO history depth is limited to the
in-memory rolling buffer collected since the simulation last started/reset -- clearly
not real multi-day historical data; the 1h/6h/24h/7d selector is provided client-side
for UI parity and simply windows whatever demo history currently exists."""
from __future__ import annotations

from fastapi import APIRouter

from app.services.scenario_engine import engine

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

METRICS = [
    "dam_health", "failure_risk", "water_level_pct", "rainfall_mm_hr",
    "pore_pressure_kpa", "deformation_mm", "concrete_strain", "seepage_lps",
    "crack_width_mm", "population_at_risk", "flood_depth_max", "shelter_occupancy_total",
]


@router.get("/history")
def history():
    return {"series": engine.series(), "metrics": METRICS, "data_source": "DEMO simulation history (in-memory)"}
