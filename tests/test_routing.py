from app.services.routing import build_road_states, find_routes, road_status


def test_road_status_bands():
    assert road_status(0.0) == "OPEN"
    assert road_status(0.5) == "AT_RISK"
    assert road_status(1.5) == "CLOSED"


def test_route_found_when_all_roads_open():
    roads = [
        {"road_id": "R1", "name": "A-B", "start_node": "A", "end_node": "B", "distance_km": 5, "speed_kmph": 50, "is_bridge": False},
    ]
    states = build_road_states(roads, {})
    routes = find_routes(states, "A", "B")
    assert routes["current"] is not None
    assert routes["current"]["nodes"] == ["A", "B"]


def test_route_reroutes_around_closed_road():
    roads = [
        {"road_id": "R1", "name": "A-B direct", "start_node": "A", "end_node": "B", "distance_km": 5, "speed_kmph": 50, "is_bridge": False},
        {"road_id": "R2", "name": "A-C", "start_node": "A", "end_node": "C", "distance_km": 6, "speed_kmph": 40, "is_bridge": False},
        {"road_id": "R3", "name": "C-B", "start_node": "C", "end_node": "B", "distance_km": 6, "speed_kmph": 40, "is_bridge": False},
    ]
    depths = {"R1": 2.0}  # closed
    states = build_road_states(roads, depths)
    routes = find_routes(states, "A", "B")
    assert routes["recommended"] is not None
    assert "R1" not in routes["recommended"]["road_ids"]
    assert routes["recommended"]["nodes"] == ["A", "C", "B"]


def test_no_route_when_disconnected():
    roads = [
        {"road_id": "R1", "name": "A-B", "start_node": "A", "end_node": "B", "distance_km": 5, "speed_kmph": 50, "is_bridge": False},
    ]
    states = build_road_states(roads, {"R1": 5.0})  # closed, no alternative
    routes = find_routes(states, "A", "B")
    assert routes["recommended"] is None
