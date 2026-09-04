from app.services.anomaly import ZScoreDetector


def test_no_anomaly_with_insufficient_history():
    detector = ZScoreDetector(threshold=2.5)
    assert detector.detect("deformation_mm", [1.0, 1.1, 1.2]) is None


def test_no_anomaly_for_stable_series():
    detector = ZScoreDetector(threshold=2.5)
    history = [4.5 + (i % 2) * 0.01 for i in range(30)]
    assert detector.detect("deformation_mm", history) is None


def test_detects_sudden_spike():
    detector = ZScoreDetector(threshold=2.5)
    history = [4.5 + (i % 2) * 0.01 for i in range(30)] + [15.0]
    result = detector.detect("deformation_mm", history)
    assert result is not None
    assert result["severity"] in ("LOW", "MEDIUM", "HIGH")
    assert result["current"] == 15.0


def test_severity_scales_with_deviation_magnitude():
    detector = ZScoreDetector(threshold=2.0)
    stable = [10.0] * 20 + [10.1] * 10
    mild = detector.detect("pore_pressure_kpa", stable + [10.3])
    extreme = detector.detect("pore_pressure_kpa", stable + [40.0])
    assert extreme is not None
    if mild is not None:
        assert abs(extreme["zscore"]) >= abs(mild["zscore"])
