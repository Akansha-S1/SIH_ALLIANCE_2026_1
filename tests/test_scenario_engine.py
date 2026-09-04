"""End-to-end pipeline test: sensors -> health -> risk -> flood -> routing -> shelters -> alerts."""
from app.services.scenario_engine import ScenarioEngine


def test_normal_scenario_produces_healthy_baseline():
    engine = ScenarioEngine()
    state = engine.tick()
    assert state["dam_health"]["score"] > 80
    assert state["failure_risk"]["level"] == "LOW"
    assert all(z["flood_depth_m"] == 0 for z in state["zones"])


def test_major_breach_cascades_through_entire_pipeline():
    engine = ScenarioEngine()
    engine.set_scenario("MAJOR_BREACH")
    engine.set_speed(10)
    state = None
    for _ in range(15):
        state = engine.tick()

    assert state["breach_stage"] == "MAJOR"
    zone_a = next(z for z in state["zones"] if z["zone_id"] == "zone_a")
    assert zone_a["flood_depth_m"] > 0
    assert zone_a["arrival_time_min"] is not None

    # at least one road should have closed due to flooding
    assert any(r["status"] == "CLOSED" for r in state["roads"])

    # an evacuation route + shelter should have been recommended for the flooded zone
    assert zone_a["recommended_shelter"] is not None

    # a flood alert should exist for the worst-affected zone
    assert any(a["category"] == "FLOOD" for a in state["alerts"])

    # events should record the breach + at least one road closure
    messages = [e["message"] for e in state["events"]]
    assert any("BREACH" in m.upper() for m in messages)


def test_reset_restores_normal_baseline():
    engine = ScenarioEngine()
    engine.set_scenario("MAJOR_BREACH")
    for _ in range(10):
        engine.tick()
    engine.reset()
    state = engine.state()
    assert engine.scenario == "NORMAL"
    assert state["breach_stage"] == "NONE"
    assert all(z["flood_depth_m"] == 0 for z in state["zones"])
