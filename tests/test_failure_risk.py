from app.services.failure_risk import compute_failure_risk
from app.services.structural_health import compute_health
from tests.test_structural_health import NORMAL_READINGS, CRITICAL_READINGS


def test_low_risk_for_normal_conditions():
    health = compute_health(NORMAL_READINGS, anomalies=[])
    risk = compute_failure_risk(NORMAL_READINGS, {k: 0.0 for k in NORMAL_READINGS}, health, anomalies=[])
    assert risk["level"] == "LOW"
    assert risk["score"] < 25


def test_critical_conditions_drive_high_risk():
    health = compute_health(CRITICAL_READINGS, anomalies=[])
    risk = compute_failure_risk(CRITICAL_READINGS, {k: 0.0 for k in CRITICAL_READINGS}, health, anomalies=[])
    assert risk["level"] in ("HIGH", "CRITICAL")
    assert risk["score"] > 50


def test_rapid_rise_increases_risk_score():
    health = compute_health(NORMAL_READINGS, anomalies=[])
    trend_flat = {k: 0.0 for k in NORMAL_READINGS}
    trend_rising = dict(trend_flat)
    trend_rising["water_level_pct"] = 2.0
    flat_risk = compute_failure_risk(NORMAL_READINGS, trend_flat, health, anomalies=[])
    rising_risk = compute_failure_risk(NORMAL_READINGS, trend_rising, health, anomalies=[])
    assert rising_risk["score"] > flat_risk["score"]


def test_explanation_lists_top_contributing_factors():
    health = compute_health(CRITICAL_READINGS, anomalies=[])
    risk = compute_failure_risk(CRITICAL_READINGS, {k: 0.0 for k in CRITICAL_READINGS}, health, anomalies=[])
    assert 0 < len(risk["explanation"]) <= 5
    assert all(isinstance(x, str) for x in risk["explanation"])
