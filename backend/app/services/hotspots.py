"""
Community Shelter Hotspots (citizen-reported safe spaces).

Citizens can report a safe space (home, hall, school, etc.) with spare
capacity. A hotspot is NEVER auto-promoted to an official/recommended
shelter -- its safety is (re)computed on every read from the SAME live
flood/risk state the rest of the app already uses (no new flood model),
by finding the nearest simulated zone and checking its current flood
depth / risk status. Capacity, distance and travel time are simple,
clearly-approximate prototype heuristics (no new routing graph nodes are
invented for arbitrary citizen-submitted coordinates).

Storage is in-memory only (matches the rest of this DEMO backend --
see event_log.py for the same pattern). A hotspot's `owner_token` is
returned once, at creation, so the reporting citizen's browser can later
update/close it without any account system.
"""
from __future__ import annotations

import math
import time
import uuid
from dataclasses import asdict, dataclass, field

from app.config import settings

VALID_TYPES = ["home", "community_hall", "school", "religious_building", "apartment", "public_building", "other"]

AVG_SPEED_KMPH = 25  # rough walking/local-transport speed for an unmapped citizen-reported point


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@dataclass
class Hotspot:
    id: str
    type: str
    lat: float
    lon: float
    capacity: int
    occupancy: int
    notes: str
    status: str  # OPEN, CLOSED
    verified: bool
    nearest_zone_id: str | None
    owner_token: str = field(repr=False)
    created_at: float = field(default_factory=time.time)

    @property
    def available(self) -> int:
        return max(0, self.capacity - self.occupancy)


class HotspotStore:
    def __init__(self) -> None:
        self._items: dict[str, Hotspot] = {}

    def _nearest_zone(self, lat: float, lon: float) -> str | None:
        if not settings.zones:
            return None
        return min(settings.zones, key=lambda z: _haversine_km(lat, lon, z["lat"], z["lon"]))["zone_id"]

    def create(self, type_: str, lat: float, lon: float, capacity: int, notes: str) -> Hotspot:
        hs = Hotspot(
            id=uuid.uuid4().hex[:10],
            type=type_ if type_ in VALID_TYPES else "other",
            lat=lat,
            lon=lon,
            capacity=max(1, int(capacity)),
            occupancy=0,
            notes=(notes or "")[:280],
            status="OPEN",
            verified=False,
            nearest_zone_id=self._nearest_zone(lat, lon),
            owner_token=uuid.uuid4().hex,
        )
        self._items[hs.id] = hs
        return hs

    def get(self, hotspot_id: str) -> Hotspot | None:
        return self._items.get(hotspot_id)

    def update(self, hotspot_id: str, owner_token: str, **patch) -> Hotspot | None:
        hs = self._items.get(hotspot_id)
        if hs is None or hs.owner_token != owner_token:
            return None
        if "capacity" in patch and patch["capacity"] is not None:
            hs.capacity = max(1, int(patch["capacity"]))
        if "occupancy" in patch and patch["occupancy"] is not None:
            hs.occupancy = max(0, int(patch["occupancy"]))
        if "status" in patch and patch["status"] in ("OPEN", "CLOSED"):
            hs.status = patch["status"]
        return hs

    def all(self) -> list[Hotspot]:
        return list(self._items.values())


store = HotspotStore()


def safety_for_zone_state(zone_state: dict | None) -> str:
    """SAFE / VERIFY / UNSAFE, derived from the existing live flood/risk state -- no new model."""
    if zone_state is None:
        return "VERIFY"
    if zone_state["flood_depth_m"] > 0 or zone_state["status"] in ("HIGH", "CRITICAL"):
        return "UNSAFE"
    if zone_state["status"] in ("MONITOR", "WARNING"):
        return "VERIFY"
    return "SAFE"


def serialize(hs: Hotspot, live_zones_by_id: dict[str, dict], relative_to_zone_id: str | None = None) -> dict:
    zone_state = live_zones_by_id.get(hs.nearest_zone_id) if hs.nearest_zone_id else None
    safety = safety_for_zone_state(zone_state)

    distance_km = None
    travel_time_min = None
    if relative_to_zone_id:
        origin = settings.zone_by_id(relative_to_zone_id)
        if origin:
            distance_km = round(_haversine_km(origin["lat"], origin["lon"], hs.lat, hs.lon), 1)
            travel_time_min = round((distance_km / AVG_SPEED_KMPH) * 60, 1)

    d = asdict(hs)
    d.pop("owner_token", None)
    d["available"] = hs.available
    d["safety"] = safety
    d["distance_km"] = distance_km
    d["travel_time_min"] = travel_time_min
    d["label"] = "AUTHORITY VERIFIED" if hs.verified else "COMMUNITY REPORTED · UNVERIFIED"
    return d
