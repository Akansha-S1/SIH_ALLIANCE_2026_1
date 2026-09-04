"""Derives display-ready sensor card data (status/trend/thresholds) from raw readings."""
from __future__ import annotations

from app.config import settings

LABELS = {
    "water_level_pct": "Reservoir Level",
    "water_level_m": "Water Level",
    "rainfall_mm_hr": "Rainfall",
    "reservoir_pressure_kpa": "Reservoir Pressure",
    "pore_pressure_kpa": "Pore Pressure",
    "concrete_strain": "Concrete Strain",
    "deformation_mm": "Deformation",
    "crack_width_mm": "Crack Width",
    "seepage_lps": "Seepage",
    "vibration_g": "Vibration",
    "temperature_c": "Temperature",
}


def status_for(sensor_id: str, value: float) -> str:
    th = settings.sensor_thresholds.get(sensor_id)
    if not th:
        return "NORMAL"
    if value <= th["normal_max"]:
        return "NORMAL"
    if value <= th["warning_max"]:
        return "WARNING"
    return "CRITICAL"


def trend_label(delta: float, eps: float = 1e-6) -> str:
    if delta > eps:
        return "RISING"
    if delta < -eps:
        return "FALLING"
    return "STABLE"


def build_sensor_cards(readings: dict[str, float], deltas: dict[str, float], histories: dict[str, list[float]]) -> list[dict]:
    cards = []
    for sid, value in readings.items():
        if sid == "water_level_m":
            continue  # shown alongside water_level_pct, not as its own card
        th = settings.sensor_thresholds.get(sid, {"unit": "", "normal_max": 0, "warning_max": 0})
        hist = histories.get(sid, [])
        change_pct = 0.0
        if len(hist) >= 10 and hist[-10] != 0:
            change_pct = (hist[-1] - hist[-10]) / abs(hist[-10]) * 100
        cards.append(
            {
                "sensor_id": sid,
                "label": LABELS.get(sid, sid),
                "value": round(value, 5),
                "unit": th.get("unit", ""),
                "trend": trend_label(deltas.get(sid, 0.0)),
                "change_pct_10min": round(change_pct, 1),
                "status": status_for(sid, value),
                "normal_max": th.get("normal_max"),
                "warning_max": th.get("warning_max"),
                "sparkline": hist[-30:],
            }
        )
    return cards
