from app.services.time_to_safety import compute_time_to_safety


def test_no_arrival_means_safe_default():
    result = compute_time_to_safety(None, None)
    assert result["safety_margin_min"] is None
    assert result["status"] == "SAFE"


def test_critical_when_margin_under_5():
    result = compute_time_to_safety(arrival_time_min=10, travel_time_min=8)
    assert result["safety_margin_min"] == 2
    assert result["status"] == "CRITICAL"


def test_safe_when_margin_over_30():
    result = compute_time_to_safety(arrival_time_min=60, travel_time_min=10)
    assert result["safety_margin_min"] == 50
    assert result["status"] == "SAFE"


def test_negative_margin_is_critical():
    result = compute_time_to_safety(arrival_time_min=10, travel_time_min=20)
    assert result["safety_margin_min"] == -10
    assert result["status"] == "CRITICAL"
