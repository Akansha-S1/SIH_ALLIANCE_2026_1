"""
Dam Failure Risk Engine (section 11).

Combines structural health, live sensor anomalies, and raw sensor values
into a single 0-100 failure-risk score with a fully itemised, weighted
breakdown of contributing factors -- exactly what the command center's
"FAILURE RISK = 82 ... contributing factors" panel renders.

All weights live in data/demo/model_config.json (`failure_risk_weights`)
so they are visible/configurable in one place, per spec section 11.
"""
from __future__ import annotations

from app.config import band_label, settings

FACTOR_LABELS = {
    "high_reservoir_level": "High reservoir level",
    "rapid_level_rise": "Rapid level rise",
    "pore_pressure_anomaly": "Pore pressure anomaly",
    "deformation_anomaly": "Deformation anomaly",
    "crack_growth": "Crack growth",
    "seepage_increase": "Seepage increase",
    "rainfall_intensity": "Rainfall intensity",
    "vibration_anomaly": "Vibration anomaly",
    "structural_health_deficit": "Structural health deficit",
}


def _ratio(value: float, warn: float, span: float) -> float:
    return max(0.0, min(1.0, (value - warn) / span)) if span else 0.0


def compute_failure_risk(readings: dict[str, float], trend_pct_per_min: dict[str, float], health: dict, anomalies: list[dict]) -> dict:
    w = settings.failure_risk_weights
    th = settings.sensor_thresholds
    anomaly_params = {a["parameter"] for a in anomalies}

    ratios = {
        "high_reservoir_level": _ratio(readings.get("water_level_pct", 0), th["water_level_pct"]["normal_max"], 25),
        "rapid_level_rise": max(0.0, min(1.0, trend_pct_per_min.get("water_level_pct", 0) / 1.2)),
        "pore_pressure_anomaly": max(
            _ratio(readings.get("pore_pressure_kpa", 0), th["pore_pressure_kpa"]["normal_max"], 90),
            0.9 if "Pore Pressure" in anomaly_params else 0.0,
        ),
        "deformation_anomaly": max(
            _ratio(readings.get("deformation_mm", 0), th["deformation_mm"]["normal_max"], 10),
            0.9 if "Deformation" in anomaly_params else 0.0,
        ),
        "crack_growth": _ratio(readings.get("crack_width_mm", 0), th["crack_width_mm"]["normal_max"], 1.5),
        "seepage_increase": max(
            _ratio(readings.get("seepage_lps", 0), th["seepage_lps"]["normal_max"], 25),
            0.7 if "Seepage" in anomaly_params else 0.0,
        ),
        "rainfall_intensity": _ratio(readings.get("rainfall_mm_hr", 0), th["rainfall_mm_hr"]["normal_max"], 40),
        "vibration_anomaly": max(
            _ratio(readings.get("vibration_g", 0), th["vibration_g"]["normal_max"], 0.35),
            0.85 if "Vibration" in anomaly_params else 0.0,
        ),
        "structural_health_deficit": max(0.0, (100 - health["score"]) / 100),
    }

    factors = []
    total = 0.0
    for key, weight in w.items():
        contribution = round(weight * ratios.get(key, 0.0), 1)
        if contribution > 0:
            factors.append({"factor": FACTOR_LABELS.get(key, key), "contribution": contribution})
        total += contribution

    score = round(min(100.0, total), 1)
    level = band_label(score, settings.failure_risk_bands)
    factors.sort(key=lambda f: -f["contribution"])
    explanation = [f["factor"] for f in factors[:5]]

    return {"score": score, "level": level, "factors": factors, "explanation": explanation}
