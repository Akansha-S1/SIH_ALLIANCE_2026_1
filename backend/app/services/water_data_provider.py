"""
Real-data connection for the Valmikinagar Barrage (Gandak River) pilot site.

Structural sensors (strain, deformation, crack width, seepage, pore pressure,
vibration) have no public real-time source and remain SIMULATED.

Hydrological readings (barrage water level, discharge, gate status, rainfall)
*do* have public official sources in principle (Bihar Water Resources
Department / CWC / India-WRIS flood forecasting). This module implements a
simple provider/fallback chain so a real feed can be dropped in without
touching any downstream code:

    CWCLiveWaterDataProvider  -- attempts one real HTTP fetch, short timeout
            |  (fails / times out / unreachable)
            v
    last known good reading, marked CACHED (if recent enough)
            |  (no cached reading, or too stale)
            v
    SimulatedWaterDataProvider -- always available, marked SIMULATED

Every reading carries an explicit `source` of "LIVE", "CACHED", or
"SIMULATED" -- the UI must show this label and NEVER present simulated data
as live. Configure the real endpoint via the CWC_DATA_URL env var; the
default points at nothing and simply fails fast into the fallback chain,
since the exact public API path/schema for this station should be
confirmed by whoever operates the deployment (portal URLs and formats
change over time) rather than hardcoded here.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Literal

Source = Literal["LIVE", "CACHED", "SIMULATED"]

CWC_DATA_URL = os.environ.get("CWC_DATA_URL", "")  # e.g. an India-WRIS / CWC station endpoint
FETCH_TIMEOUT_S = 4.0
CACHE_STALE_AFTER_S = 30 * 60  # serve a stale-but-real reading as CACHED for up to 30 min


@dataclass
class WaterReading:
    water_level_m: float | None
    discharge_cumecs: float | None
    rainfall_mm_hr: float | None
    gate_status: str | None
    source: Source
    fetched_at: float = field(default_factory=time.time)


class WaterDataProvider:
    """Abstract real-data source for barrage hydrology."""

    def fetch(self) -> WaterReading | None:
        raise NotImplementedError


class CWCLiveWaterDataProvider(WaterDataProvider):
    """
    Best-effort fetch against a configurable public station endpoint
    (Bihar WRD / CWC / India-WRIS). Returns None on any failure -- unreachable
    host, timeout, non-200, unexpected schema -- so callers always have a
    clean fallback path. Never raises.
    """

    def fetch(self) -> WaterReading | None:
        if not CWC_DATA_URL:
            return None
        try:
            import httpx

            resp = httpx.get(CWC_DATA_URL, timeout=FETCH_TIMEOUT_S)
            resp.raise_for_status()
            data = resp.json()
            # Expected shape is deployment-specific; adjust this mapping to
            # whatever the configured CWC_DATA_URL actually returns.
            return WaterReading(
                water_level_m=data.get("water_level_m"),
                discharge_cumecs=data.get("discharge_cumecs"),
                rainfall_mm_hr=data.get("rainfall_mm_hr"),
                gate_status=data.get("gate_status"),
                source="LIVE",
            )
        except Exception:
            return None


class SimulatedWaterDataProvider(WaterDataProvider):
    """Always-available fallback -- explicitly labelled SIMULATED, never presented as real."""

    def fetch(self) -> WaterReading | None:
        return WaterReading(
            water_level_m=None,
            discharge_cumecs=None,
            rainfall_mm_hr=None,
            gate_status=None,
            source="SIMULATED",
        )


class WaterDataCache:
    """Holds the most recent reading and applies the LIVE -> CACHED -> SIMULATED fallback chain."""

    def __init__(self) -> None:
        self.live = CWCLiveWaterDataProvider()
        self.simulated = SimulatedWaterDataProvider()
        self._last_live: WaterReading | None = None

    def refresh(self) -> WaterReading:
        fresh = self.live.fetch()
        if fresh is not None:
            self._last_live = fresh
            return fresh
        if self._last_live is not None and (time.time() - self._last_live.fetched_at) < CACHE_STALE_AFTER_S:
            cached = WaterReading(
                water_level_m=self._last_live.water_level_m,
                discharge_cumecs=self._last_live.discharge_cumecs,
                rainfall_mm_hr=self._last_live.rainfall_mm_hr,
                gate_status=self._last_live.gate_status,
                source="CACHED",
                fetched_at=self._last_live.fetched_at,
            )
            return cached
        return self.simulated.fetch()  # type: ignore[return-value]


water_data_cache = WaterDataCache()
