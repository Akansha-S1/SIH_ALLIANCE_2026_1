"""
Dam Structural Health Score (section 9).

Transparent, rule-based, weighted scoring model. Every sensor's status
(NORMAL/WARNING/CRITICAL, per data/demo/model_config.json thresholds)
deducts points scaled by that sensor's configured weight. Fully explainable:
`compute_health` returns the per-factor contribution alongside the score.

NOTE: bands/weights are prototype/demo configuration, not a validated
engineering standard (see model_config.json `_note`).
"""
from __future__ import annotations

from app.config import band_label, settings
from app.services.sensor_status import LABELS, status_for

STATUS_DEDUCTION = {"NORMAL": 0.0, "WARNING": 0.55, "CRITICAL": 1.0}


def compute_health(readings: dict[str, float], anomalies: list[dict]) -> dict:
    weights = settings.health_weights
    total_deduction = 0.0
    factors = []

    for sid, weight in weights.items():
        value = readings.get(sid)
        if value is None:
            continue
        status = status_for(sid, value)
        deduction = STATUS_DEDUCTION[status] * weight * 100
        total_deduction += deduction
        factors.append({"parameter": LABELS.get(sid, sid), "status": status, "contribution": -round(deduction, 1)})

    # anomaly detections chip away extra health independent of raw threshold status
    anomaly_penalty = 0.0
    for a in anomalies:
        sev_weight = {"LOW": 1.5, "MEDIUM": 3.5, "HIGH": 6.5}.get(a["severity"], 0)
        anomaly_penalty += sev_weight
    anomaly_penalty = min(anomaly_penalty, 20.0)
    if anomaly_penalty:
        factors.append({"parameter": "Anomaly detections", "status": "WARNING", "contribution": -round(anomaly_penalty, 1)})

    score = max(0.0, 100.0 - total_deduction - anomaly_penalty)
    label = band_label(score, settings.health_bands)

    factors.sort(key=lambda f: f["contribution"])
    return {"score": round(score, 1), "label": label, "factors": factors}
