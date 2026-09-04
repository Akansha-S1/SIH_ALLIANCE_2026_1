"""
Emergency Alert Engine (section 21).

Generates simulated authority + public alerts from the current state of
the pipeline (structural anomalies, failure risk, zone flood risk,
time-to-safety). Alerts are recomputed fresh every tick (stateless) --
the scenario engine diffs against the previous tick's alert keys to log
"alert generated" events exactly once per transition, and to know which
alerts are new vs still-active.

NO REAL SMS/EMAIL IS SENT. This simulates the notification content only.
"""
from __future__ import annotations


def _dam_structural_alerts(anomalies: list[dict]) -> list[dict]:
    alerts = []
    for a in anomalies:
        if a["severity"] not in ("MEDIUM", "HIGH"):
            continue
        severity = "CRITICAL" if a["severity"] == "HIGH" else "WARNING"
        alerts.append(
            {
                "id": f"dam-{a['sensor_id']}",
                "category": "DAM_STRUCTURAL",
                "severity": severity,
                "title": "DAM STRUCTURAL WARNING",
                "zone_id": None,
                "message": f"{a['parameter']} deviation of {a['deviation']:+.4g} from expected baseline.",
                "details": {
                    "parameter": a["parameter"],
                    "current": a["current"],
                    "expected": a["expected"],
                    "trend": "Rapid increase" if a["deviation"] > 0 else "Rapid decrease",
                },
                "recommended_action": "Inspect / initiate emergency protocol",
            }
        )
    return alerts


def _failure_risk_alert(failure_risk: dict) -> list[dict]:
    if failure_risk["level"] not in ("HIGH", "CRITICAL"):
        return []
    return [
        {
            "id": "dam-failure-risk",
            "category": "DAM_STRUCTURAL",
            "severity": "CRITICAL" if failure_risk["level"] == "CRITICAL" else "HIGH",
            "title": "DAM FAILURE RISK ELEVATED",
            "zone_id": None,
            "message": f"Failure risk at {failure_risk['score']}/100 ({failure_risk['level']}). Key drivers: "
            + ", ".join(failure_risk["explanation"][:3]),
            "details": {"score": failure_risk["score"], "level": failure_risk["level"]},
            "recommended_action": "Activate emergency action plan; notify downstream authorities",
        }
    ]


def _flood_alerts(zone_states: list[dict], shelter_recs: dict[str, dict | None], tts_by_zone: dict[str, dict]) -> list[dict]:
    alerts = []
    for z in zone_states:
        if z["status"] not in ("HIGH", "CRITICAL"):
            continue
        rec = shelter_recs.get(z["zone_id"])
        tts = tts_by_zone.get(z["zone_id"], {})
        alerts.append(
            {
                "id": f"flood-{z['zone_id']}",
                "category": "FLOOD",
                "severity": "CRITICAL" if z["status"] == "CRITICAL" else "HIGH",
                "title": "CRITICAL FLOOD ALERT" if z["status"] == "CRITICAL" else "FLOOD WARNING",
                "zone_id": z["zone_id"],
                "message": f"{z['name']}: flood arrival in {z['arrival_time_min']} min, {z['exposed_population']:,} people exposed.",
                "details": {
                    "arrival_time_min": z["arrival_time_min"],
                    "risk_score": z["risk_score"],
                    "recommended_shelter": rec["shelter_name"] if rec else None,
                    "travel_time_min": rec["travel_time_min"] if rec else None,
                    "safety_margin_min": tts.get("safety_margin_min"),
                },
                "recommended_action": "EVACUATE",
            }
        )
    return alerts


def generate_alerts(
    health: dict,
    failure_risk: dict,
    anomalies: list[dict],
    zone_states: list[dict],
    shelter_recs: dict[str, dict | None],
    tts_by_zone: dict[str, dict],
) -> list[dict]:
    alerts = []
    alerts += _dam_structural_alerts(anomalies)
    alerts += _failure_risk_alert(failure_risk)
    alerts += _flood_alerts(zone_states, shelter_recs, tts_by_zone)
    return alerts
