"""Time-to-Safety Engine (section 18): TIME TO SAFETY = FLOOD ARRIVAL - EVACUATION TRAVEL TIME."""
from __future__ import annotations

from app.config import band_label, settings


def compute_time_to_safety(arrival_time_min: float | None, travel_time_min: float | None) -> dict:
    if arrival_time_min is None or travel_time_min is None:
        return {"safety_margin_min": None, "status": "SAFE"}
    margin = round(arrival_time_min - travel_time_min, 1)
    status = band_label(margin, settings.tts_bands)
    return {"safety_margin_min": margin, "status": status}
