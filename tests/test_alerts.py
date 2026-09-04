from app.services.alerts import generate_alerts


def test_no_alerts_for_healthy_normal_state():
    health = {"score": 98, "label": "NORMAL"}
    failure_risk = {"score": 5, "level": "LOW", "explanation": []}
    alerts = generate_alerts(health, failure_risk, anomalies=[], zone_states=[], shelter_recs={}, tts_by_zone={})
    assert alerts == []


def test_high_severity_anomaly_creates_dam_structural_alert():
    health = {"score": 98, "label": "NORMAL"}
    failure_risk = {"score": 5, "level": "LOW", "explanation": []}
    anomalies = [{"sensor_id": "deformation_mm", "parameter": "Deformation", "current": 8.7, "expected": 4.5, "deviation": 4.2, "severity": "HIGH"}]
    alerts = generate_alerts(health, failure_risk, anomalies, zone_states=[], shelter_recs={}, tts_by_zone={})
    assert any(a["category"] == "DAM_STRUCTURAL" and a["severity"] == "CRITICAL" for a in alerts)


def test_critical_zone_creates_evacuate_alert():
    health = {"score": 60, "label": "WARNING"}
    failure_risk = {"score": 80, "level": "CRITICAL", "explanation": ["Deformation anomaly"]}
    zone_states = [
        {
            "zone_id": "zone_b", "name": "Zone B", "status": "CRITICAL", "arrival_time_min": 32,
            "risk_score": 90, "exposed_population": 6900,
        }
    ]
    shelter_recs = {"zone_b": {"shelter_name": "Shelter 03", "travel_time_min": 16}}
    tts_by_zone = {"zone_b": {"safety_margin_min": 16, "status": "HIGH RISK"}}
    alerts = generate_alerts(health, failure_risk, [], zone_states, shelter_recs, tts_by_zone)
    flood_alerts = [a for a in alerts if a["category"] == "FLOOD"]
    assert len(flood_alerts) == 1
    assert flood_alerts[0]["recommended_action"] == "EVACUATE"
    assert flood_alerts[0]["details"]["recommended_shelter"] == "Shelter 03"
