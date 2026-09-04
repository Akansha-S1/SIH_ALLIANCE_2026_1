from app.config import settings
from app.services.flood_sim import flood_depth_at_road, simulate_zones


def test_no_breach_means_no_flood():
    zones = simulate_zones(settings.zones, breach_stage=0, breach_onset_min=-1, sim_minutes=10, failure_risk_score=10)
    assert all(z["flood_depth_m"] == 0.0 for z in zones)
    assert all(z["arrival_time_min"] is None for z in zones)


def test_closer_zones_flood_before_farther_zones():
    zones = simulate_zones(settings.zones, breach_stage=2, breach_onset_min=0, sim_minutes=60, failure_risk_score=90)
    by_id = {z["zone_id"]: z for z in zones}
    assert by_id["zone_a"]["arrival_time_min"] < by_id["zone_d"]["arrival_time_min"]


def test_major_breach_worse_than_partial_breach():
    major = simulate_zones(settings.zones, breach_stage=2, breach_onset_min=0, sim_minutes=60, failure_risk_score=90)
    partial = simulate_zones(settings.zones, breach_stage=1, breach_onset_min=0, sim_minutes=60, failure_risk_score=90)
    major_a = next(z for z in major if z["zone_id"] == "zone_a")
    partial_a = next(z for z in partial if z["zone_id"] == "zone_a")
    assert major_a["flood_depth_m"] >= partial_a["flood_depth_m"]


def test_highland_road_stays_open_while_valley_road_floods():
    zone_states = {
        "zone_a": {"flood_depth_m": 5.0},
    }
    zones_by_id = {"zone_a": {"elevation_m": 780}}
    valley_road = {"start_node": "zone_a", "end_node": "zone_b", "min_elevation_m": 750, "is_bridge": False}
    highland_road = {"start_node": "zone_a", "end_node": "shelter_01", "min_elevation_m": 830, "is_bridge": False}
    assert flood_depth_at_road(valley_road, zone_states, zones_by_id) > 0
    assert flood_depth_at_road(highland_road, zone_states, zones_by_id) == 0
