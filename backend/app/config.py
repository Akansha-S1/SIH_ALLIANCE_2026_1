"""
Central configuration loader for JALRAKSHAK AI.

Loads the DEMO model configuration (sensor thresholds, health-score weights,
failure-risk weights, flood-model constants) and the DEMO geospatial dataset
(dam, zones, roads, shelters, infrastructure) from the top-level /data
directory. All of this is clearly DEMO/PROTOTYPE data -- see data/demo/*.json
for the `_note` fields explaining what is illustrative vs real.

This module is the single place a real deployment would swap out to point
at a real database / config service instead of local JSON files.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
DATA_DIR = REPO_ROOT / "data"
DEMO_DIR = DATA_DIR / "demo"


def _load_json(path: Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class Settings:
    """Loads and caches all demo configuration + geospatial reference data."""

    def __init__(self) -> None:
        self.model_config: dict = _load_json(DEMO_DIR / "model_config.json")
        self.dam: dict = _load_json(DEMO_DIR / "dam.json")
        self.zones: list[dict] = _load_json(DEMO_DIR / "zones.json")
        self.shelters: list[dict] = _load_json(DEMO_DIR / "shelters.json")
        self.roads: list[dict] = _load_json(DEMO_DIR / "roads.json")
        self.infrastructure: list[dict] = _load_json(DEMO_DIR / "infrastructure.json")

    # convenience accessors -------------------------------------------------
    @property
    def sensor_thresholds(self) -> dict:
        return self.model_config["sensors"]

    @property
    def health_weights(self) -> dict:
        return self.model_config["health_weights"]

    @property
    def health_bands(self) -> list[dict]:
        return self.model_config["health_bands"]

    @property
    def failure_risk_weights(self) -> dict:
        return self.model_config["failure_risk_weights"]

    @property
    def failure_risk_bands(self) -> list[dict]:
        return self.model_config["failure_risk_bands"]

    @property
    def tts_bands(self) -> list[dict]:
        return self.model_config["time_to_safety_bands_min"]

    @property
    def flood_model(self) -> dict:
        return self.model_config["flood_model"]

    @property
    def anomaly_zscore_threshold(self) -> float:
        return self.model_config["anomaly_zscore_threshold"]

    def zone_by_id(self, zone_id: str) -> dict | None:
        return next((z for z in self.zones if z["zone_id"] == zone_id), None)

    def shelter_by_id(self, shelter_id: str) -> dict | None:
        return next((s for s in self.shelters if s["shelter_id"] == shelter_id), None)


settings = Settings()


def band_label(value: float, bands: list[dict]) -> str:
    """
    Return the label of the band a numeric value falls into.

    Bands are configured with integer min/max (e.g. 75-91, 92-100) but scores
    are floats, so a naive inclusive min<=value<=max check leaves gaps
    (91.5 matches neither band). Instead treat each band's `min` as a
    descending threshold: the highest band whose min the value clears wins.
    This exactly matches the configured bands at integer values while
    covering every float in between with no gaps.
    """
    for b in sorted(bands, key=lambda b: b["min"], reverse=True):
        if value >= b["min"]:
            return b["label"]
    return "UNKNOWN"
