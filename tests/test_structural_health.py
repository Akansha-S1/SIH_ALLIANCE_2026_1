from app.services.structural_health import compute_health

NORMAL_READINGS = {
    "water_level_pct": 55,
    "reservoir_pressure_kpa": 800,
    "pore_pressure_kpa": 120,
    "concrete_strain": 0.0002,
    "deformation_mm": 3.0,
    "crack_width_mm": 0.3,
    "seepage_lps": 8,
    "vibration_g": 0.06,
    "temperature_c": 27,
    "rainfall_mm_hr": 4,
}

CRITICAL_READINGS = {
    "water_level_pct": 98,
    "reservoir_pressure_kpa": 1400,
    "pore_pressure_kpa": 260,
    "concrete_strain": 0.0009,
    "deformation_mm": 14,
    "crack_width_mm": 2.0,
    "seepage_lps": 35,
    "vibration_g": 0.5,
    "temperature_c": 30,
    "rainfall_mm_hr": 60,
}


def test_normal_readings_give_high_score():
    result = compute_health(NORMAL_READINGS, anomalies=[])
    assert result["score"] >= 92
    assert result["label"] == "NORMAL"


def test_critical_readings_give_low_score():
    result = compute_health(CRITICAL_READINGS, anomalies=[])
    assert result["score"] < 50


def test_anomalies_reduce_score_further():
    without = compute_health(NORMAL_READINGS, anomalies=[])
    with_anomaly = compute_health(
        NORMAL_READINGS, anomalies=[{"severity": "HIGH", "sensor_id": "deformation_mm"}]
    )
    assert with_anomaly["score"] < without["score"]


def test_factors_are_explainable_and_signed_negative_or_zero():
    result = compute_health(CRITICAL_READINGS, anomalies=[])
    assert len(result["factors"]) > 0
    for f in result["factors"]:
        assert f["contribution"] <= 0
