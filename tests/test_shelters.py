from app.services.routing import build_road_states
from app.services.shelters import build_shelter_states, recommend_shelter_for_zone


def _shelters():
    return [
        {"shelter_id": "S1", "name": "Shelter 1", "lat": 0, "lon": 0, "capacity": 100, "occupancy": 100},
        {"shelter_id": "S2", "name": "Shelter 2", "lat": 0, "lon": 0, "capacity": 500, "occupancy": 50},
    ]


def test_full_shelter_marked_full():
    states = build_shelter_states(_shelters(), {})
    s1 = next(s for s in states if s["shelter_id"] == "S1")
    assert s1["available"] == 0
    assert s1["status"] == "FULL"


def test_shelter_recommendation_skips_full_shelters():
    roads = [
        {"road_id": "R1", "name": "Z-S1", "start_node": "Z", "end_node": "S1", "distance_km": 2, "speed_kmph": 40, "is_bridge": False},
        {"road_id": "R2", "name": "Z-S2", "start_node": "Z", "end_node": "S2", "distance_km": 10, "speed_kmph": 40, "is_bridge": False},
    ]
    shelter_states = build_shelter_states(_shelters(), {})
    road_states = build_road_states(roads, {})
    rec = recommend_shelter_for_zone("Z", shelter_states, road_states)
    assert rec is not None
    assert rec["shelter_id"] == "S2"  # only one with availability, even though farther
