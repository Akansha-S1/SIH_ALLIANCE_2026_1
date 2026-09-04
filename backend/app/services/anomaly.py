"""
Explainable statistical anomaly detection.

Method: rolling-window mean/std -> z-score. This is intentionally simple
and transparent (see section 31 of the spec: "do not overcomplicate the
first version"). `IsolationForestDetector` is provided as an optional
drop-in upgrade using scikit-learn-style logic; the architecture lets it
replace `ZScoreDetector` without touching callers.
"""
from __future__ import annotations

import statistics
from datetime import datetime, timezone

from app.config import settings

LABELS = {
    "water_level_pct": "Reservoir Level",
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

MIN_SAMPLES = 12


def _severity(zscore: float) -> str:
    az = abs(zscore)
    if az >= 5.0:
        return "HIGH"
    if az >= 3.5:
        return "MEDIUM"
    return "LOW"


class ZScoreDetector:
    """Rolling mean/std anomaly detector, one instance shared across sensors."""

    def __init__(self, threshold: float | None = None):
        self.threshold = threshold or settings.anomaly_zscore_threshold

    def detect(self, sensor_id: str, history: list[float]) -> dict | None:
        if len(history) < MIN_SAMPLES:
            return None
        *past, current = history
        window = past[-60:]  # look at up to last 60 samples excluding current
        if len(window) < MIN_SAMPLES - 1:
            return None
        mean = statistics.fmean(window)
        try:
            stdev = statistics.stdev(window)
        except statistics.StatisticsError:
            stdev = 0.0
        if stdev < 1e-9:
            return None
        zscore = (current - mean) / stdev
        if abs(zscore) < self.threshold:
            return None
        return {
            "parameter": LABELS.get(sensor_id, sensor_id),
            "sensor_id": sensor_id,
            "current": round(current, 5),
            "expected": round(mean, 5),
            "deviation": round(current - mean, 5),
            "zscore": round(zscore, 2),
            "severity": _severity(zscore),
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        }

    def detect_all(self, histories: dict[str, list[float]]) -> list[dict]:
        out = []
        for sid, hist in histories.items():
            ev = self.detect(sid, hist)
            if ev:
                out.append(ev)
        return out


class IsolationForestDetector:
    """
    Optional ML-based multivariate anomaly detector (scikit-learn Isolation
    Forest). Not enabled by default in the DEMO to keep the pipeline fully
    explainable; the architecture allows swapping this in for `ZScoreDetector`
    once enough real historical data exists to fit it meaningfully.
    """

    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self._model = None

    def fit(self, feature_matrix: list[list[float]]) -> None:
        from sklearn.ensemble import IsolationForest  # optional dependency

        self._model = IsolationForest(contamination=self.contamination, random_state=42)
        self._model.fit(feature_matrix)

    def score(self, feature_vector: list[float]) -> float:
        if self._model is None:
            raise RuntimeError("IsolationForestDetector not fitted")
        return float(self._model.decision_function([feature_vector])[0])
