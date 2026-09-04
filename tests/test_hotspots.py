from app.services.hotspots import HotspotStore, safety_for_zone_state
from app.config import settings


def test_create_assigns_nearest_zone_and_owner_token():
    store = HotspotStore()
    z = settings.zones[0]
    hs = store.create("home", z["lat"] + 0.001, z["lon"] + 0.001, 10, "spare room")
    assert hs.nearest_zone_id == z["zone_id"]
    assert hs.owner_token
    assert hs.available == 10


def test_update_requires_matching_owner_token():
    store = HotspotStore()
    hs = store.create("home", 27.4, 83.9, 10, "")
    assert store.update(hs.id, "wrong-token", capacity=20) is None
    updated = store.update(hs.id, hs.owner_token, occupancy=4)
    assert updated is not None
    assert updated.available == 6


def test_safety_unsafe_when_flooded():
    assert safety_for_zone_state({"flood_depth_m": 1.2, "status": "CRITICAL"}) == "UNSAFE"


def test_safety_verify_when_zone_warning_but_dry():
    assert safety_for_zone_state({"flood_depth_m": 0.0, "status": "WARNING"}) == "VERIFY"


def test_safety_safe_when_zone_normal():
    assert safety_for_zone_state({"flood_depth_m": 0.0, "status": "NORMAL"}) == "SAFE"


def test_full_hotspot_has_zero_available():
    store = HotspotStore()
    hs = store.create("home", 27.4, 83.9, 5, "")
    store.update(hs.id, hs.owner_token, occupancy=5)
    assert hs.available == 0
