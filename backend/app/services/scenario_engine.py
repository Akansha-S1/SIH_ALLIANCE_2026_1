"""
Scenario Engine - the beating heart of JALRAKSHAK AI.

Ties the entire pipeline together every tick:

    sensors -> anomaly detection -> structural health -> failure risk
        -> flood simulation -> zone risk -> routing -> shelters
        -> time-to-safety -> alerts -> event log -> WebSocket broadcast

Runs as a background asyncio task. Scenario selection (NORMAL, HEAVY_RAINFALL,
RAPID_RESERVOIR_RISE, STRUCTURAL_ANOMALY, PARTIAL_BREACH, MAJOR_BREACH) and
playback controls (start/pause/reset/speed) are exposed via REST and drive
the same simulation state consumed by the 3D digital twin, dashboards and
WebSocket clients.
"""
from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime, timezone

from app.config import settings
from app.services.alerts import generate_alerts
from app.services.anomaly import ZScoreDetector
from app.services.failure_risk import compute_failure_risk
from app.services.flood_sim import flood_depth_at_road, simulate_zones
from app.services.routing import build_road_states
from app.services.sensor_provider import SENSOR_IDS, DemoSensorProvider
from app.services.sensor_status import LABELS, build_sensor_cards, status_for
from app.services.shelters import build_shelter_states, recommend_shelter_for_zone
from app.services.structural_health import compute_health
from app.services.time_to_safety import compute_time_to_safety
from app.services.event_log import event_log

SCENARIOS = [
    "NORMAL",
    "HEAVY_RAINFALL",
    "RAPID_RESERVOIR_RISE",
    "STRUCTURAL_ANOMALY",
    "PARTIAL_BREACH",
    "MAJOR_BREACH",
]

BREACH_STAGE_BY_SCENARIO = {
    "NORMAL": 0,
    "HEAVY_RAINFALL": 0,
    "RAPID_RESERVOIR_RISE": 0,
    "STRUCTURAL_ANOMALY": 0,
    "PARTIAL_BREACH": 1,
    "MAJOR_BREACH": 2,
}

REAL_TICK_SECONDS = 1.5
SIM_MINUTES_PER_TICK = 0.5

ZONE_STATUS_RANK = {"NORMAL": 0, "MONITOR": 1, "WARNING": 2, "HIGH": 3, "CRITICAL": 4}
SENSOR_STATUS_RANK = {"NORMAL": 0, "WARNING": 1, "CRITICAL": 2}


class ScenarioEngine:
    def __init__(self):
        self.provider = DemoSensorProvider()
        self.detector = ZScoreDetector()
        self.scenario = "NORMAL"
        self.running = True
        self.speed = 1.0
        self._task: asyncio.Task | None = None
        self._broadcast_cb = None
        self._state: dict = {}

        self._prev_health_label: str | None = None
        self._prev_failure_label: str | None = None
        self._prev_road_status: dict[str, str] = {}
        self._prev_zone_status: dict[str, str] = {}
        self._prev_sensor_status: dict[str, str] = {}
        self._prev_alert_ids: set[str] = set()

        series_keys = [
            "dam_health", "failure_risk", "water_level_pct", "rainfall_mm_hr",
            "pore_pressure_kpa", "deformation_mm", "concrete_strain", "seepage_lps",
            "crack_width_mm", "population_at_risk", "flood_depth_max", "shelter_occupancy_total",
        ]
        self._series: dict[str, deque] = {k: deque(maxlen=500) for k in series_keys}

        event_log.add("JALRAKSHAK AI system initialised - DEMO MODE (simulated sensors)", "SYSTEM")

    # -- lifecycle -----------------------------------------------------
    def set_broadcast(self, cb) -> None:
        self._broadcast_cb = cb

    async def start_loop(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._run())

    async def _run(self) -> None:
        while True:
            if self.running:
                self.tick()
                if self._broadcast_cb:
                    await self._broadcast_cb(self._state)
            await asyncio.sleep(REAL_TICK_SECONDS)

    # -- controls --------------------------------------------------------
    def set_scenario(self, scenario: str) -> None:
        if scenario not in SCENARIOS:
            raise ValueError(f"Unknown scenario '{scenario}'")
        if scenario == self.scenario:
            return
        self.scenario = scenario
        event_log.add(f"Scenario triggered: {scenario.replace('_', ' ')}", "SCENARIO")
        stage = BREACH_STAGE_BY_SCENARIO[scenario]
        if stage > self.provider.state.breach_stage:
            self.provider.set_breach_stage(stage)
            label = "PARTIAL BREACH" if stage == 1 else "MAJOR DAM BREACH"
            event_log.add(f"{label} scenario triggered - flood simulation started", "BREACH")

    def set_running(self, running: bool) -> None:
        self.running = running
        event_log.add("Simulation resumed" if running else "Simulation paused", "SYSTEM")

    def set_speed(self, speed: float) -> None:
        self.speed = max(0.5, min(10.0, speed))
        event_log.add(f"Simulation speed set to x{self.speed:g}", "SYSTEM")

    def reset(self) -> None:
        self.provider = DemoSensorProvider()
        self.detector = ZScoreDetector()
        self.scenario = "NORMAL"
        self.running = True
        self.speed = 1.0
        self._prev_health_label = None
        self._prev_failure_label = None
        self._prev_road_status = {}
        self._prev_zone_status = {}
        self._prev_sensor_status = {}
        self._prev_alert_ids = set()
        for dq in self._series.values():
            dq.clear()
        event_log.add("Simulation reset to NORMAL baseline", "SYSTEM")
        self.tick()

    # -- main tick ---------------------------------------------------------
    def tick(self) -> dict:
        dt_min = SIM_MINUTES_PER_TICK * self.speed
        readings = self.provider.tick(dt_min, self.scenario)
        histories = {sid: self.provider.history(sid) for sid in SENSOR_IDS}
        deltas = {sid: self.provider.trend_pct(sid) for sid in SENSOR_IDS}
        trend_per_min = {sid: (deltas[sid] / dt_min if dt_min else 0.0) for sid in SENSOR_IDS}

        anomalies = self.detector.detect_all(histories)
        health = compute_health(readings, anomalies)
        failure_risk = compute_failure_risk(readings, trend_per_min, health, anomalies)

        zones = settings.zones
        zone_states = simulate_zones(
            zones,
            self.provider.state.breach_stage,
            self.provider.state.breach_onset_min,
            self.provider.state.sim_minutes,
            failure_risk["score"],
        )
        zone_by_id = {z["zone_id"]: z for z in zone_states}

        depth_by_road = {r["road_id"]: flood_depth_at_road(r, zone_by_id, {z["zone_id"]: z for z in zones}) for r in settings.roads}
        road_states = build_road_states(settings.roads, depth_by_road)
        shelter_states = build_shelter_states(settings.shelters, zone_by_id)

        shelter_recs: dict[str, dict | None] = {}
        tts_by_zone: dict[str, dict] = {}
        for z in zone_states:
            rec = recommend_shelter_for_zone(z["zone_id"], shelter_states, road_states) if z["arrival_time_min"] is not None else None
            shelter_recs[z["zone_id"]] = rec
            travel_time = rec["travel_time_min"] if rec else None
            tts_by_zone[z["zone_id"]] = compute_time_to_safety(z["arrival_time_min"], travel_time)

        for z in zone_states:
            tts = tts_by_zone[z["zone_id"]]
            rec = shelter_recs[z["zone_id"]]
            z["travel_time_min"] = rec["travel_time_min"] if rec else None
            z["safety_margin_min"] = tts["safety_margin_min"]
            z["tts_status"] = tts["status"]
            z["recommended_shelter"] = rec["shelter_name"] if rec else None
            z["recommended_route"] = rec["route_nodes"] if rec else None

        alerts = generate_alerts(health, failure_risk, anomalies, zone_states, shelter_recs, tts_by_zone)

        self._log_transitions(readings, health, failure_risk, road_states, zone_states, alerts)

        sensor_cards = build_sensor_cards(readings, deltas, histories)
        worst_zone = self._worst_zone(zone_states)

        summary = self._build_summary(health, failure_risk, readings, worst_zone)

        self._state = {
            "type": "state_update",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sim_minutes": round(self.provider.state.sim_minutes, 1),
            "scenario": self.scenario,
            "running": self.running,
            "speed": self.speed,
            "breach_stage": self.provider.breach_stage_label(),
            "sensors": sensor_cards,
            "dam_health": health,
            "failure_risk": failure_risk,
            "anomalies": anomalies,
            "zones": zone_states,
            "roads": road_states,
            "shelters": shelter_states,
            "alerts": alerts,
            "events": event_log.recent(40),
            "summary": summary,
        }
        self._record_series(health, failure_risk, readings, summary, zone_states, shelter_states)
        return self._state

    def state(self) -> dict:
        return self._state or self.tick()

    def series(self) -> dict[str, list[dict]]:
        return {k: list(v) for k, v in self._series.items()}

    def _record_series(self, health, failure_risk, readings, summary, zone_states, shelter_states) -> None:
        t = round(self.provider.state.sim_minutes, 1)
        flood_depth_max = max((z["flood_depth_m"] for z in zone_states), default=0.0)
        occupancy_total = sum(s["occupancy"] for s in shelter_states)
        values = {
            "dam_health": health["score"],
            "failure_risk": failure_risk["score"],
            "water_level_pct": readings["water_level_pct"],
            "rainfall_mm_hr": readings["rainfall_mm_hr"],
            "pore_pressure_kpa": readings["pore_pressure_kpa"],
            "deformation_mm": readings["deformation_mm"],
            "concrete_strain": readings["concrete_strain"],
            "seepage_lps": readings["seepage_lps"],
            "crack_width_mm": readings["crack_width_mm"],
            "population_at_risk": summary["population_at_risk"],
            "flood_depth_max": round(flood_depth_max, 2),
            "shelter_occupancy_total": occupancy_total,
        }
        for key, value in values.items():
            self._series[key].append({"t": t, "v": value})

    # -- helpers -------------------------------------------------------
    def _worst_zone(self, zone_states: list[dict]) -> dict | None:
        candidates = [z for z in zone_states if z.get("arrival_time_min") is not None]
        if not candidates:
            return None
        return max(candidates, key=lambda z: (ZONE_STATUS_RANK.get(z["status"], 0), z["risk_score"]))

    def _build_summary(self, health: dict, failure_risk: dict, readings: dict, worst_zone: dict | None) -> dict:
        if worst_zone:
            action = "MONITOR SITUATION"
            margin = worst_zone.get("safety_margin_min")
            if margin is not None and margin < 5:
                action = "IMMEDIATE EVACUATION - CRITICAL"
            elif margin is not None and margin < 15:
                action = "IMMEDIATE EVACUATION PREPARATION"
            elif margin is not None and margin < 30:
                action = "PREPARE FOR EVACUATION"
            elif failure_risk["level"] in ("HIGH", "CRITICAL"):
                action = "INCREASE MONITORING / PREPARE CONTINGENCY"
        elif failure_risk["level"] in ("HIGH", "CRITICAL"):
            action = "INCREASE MONITORING / PREPARE CONTINGENCY"
        else:
            action = "MONITOR - NORMAL OPERATIONS"

        return {
            "dam_health": health["score"],
            "dam_health_label": health["label"],
            "failure_risk": failure_risk["score"],
            "failure_risk_level": failure_risk["level"],
            "reservoir_level_pct": round(readings["water_level_pct"], 1),
            "flood_arrival_min": worst_zone["arrival_time_min"] if worst_zone else None,
            "population_at_risk": worst_zone["exposed_population"] if worst_zone else 0,
            "safety_margin_min": worst_zone["safety_margin_min"] if worst_zone else None,
            "worst_zone": worst_zone["name"] if worst_zone else None,
            "worst_zone_id": worst_zone["zone_id"] if worst_zone else None,
            "recommended_action": action,
            "recommended_shelter": worst_zone.get("recommended_shelter") if worst_zone else None,
        }

    def _log_transitions(self, readings, health, failure_risk, road_states, zone_states, alerts) -> None:
        if health["label"] != self._prev_health_label:
            if self._prev_health_label is not None:
                event_log.add(f"Dam structural health changed to {health['label']} ({health['score']}/100)", "STRUCTURAL")
            self._prev_health_label = health["label"]

        if failure_risk["level"] != self._prev_failure_label:
            if self._prev_failure_label is not None:
                event_log.add(f"Failure risk level changed to {failure_risk['level']} ({failure_risk['score']}/100)", "RISK")
            self._prev_failure_label = failure_risk["level"]

        for sid in SENSOR_IDS:
            status = status_for(sid, readings[sid])
            prev = self._prev_sensor_status.get(sid)
            if prev is not None and status != prev:
                direction = "increased" if SENSOR_STATUS_RANK[status] > SENSOR_STATUS_RANK[prev] else "improved"
                event_log.add(f"{LABELS.get(sid, sid)} {direction} to {status}", "SENSOR")
            self._prev_sensor_status[sid] = status

        for r in road_states:
            prev = self._prev_road_status.get(r["road_id"])
            if prev is not None and r["status"] != prev:
                if r["status"] == "CLOSED":
                    event_log.add(f"{r['name']} flooded - route CLOSED", "ROUTE")
                elif r["status"] == "AT_RISK":
                    event_log.add(f"{r['name']} at risk of flooding", "ROUTE")
                else:
                    event_log.add(f"{r['name']} reopened", "ROUTE")
            self._prev_road_status[r["road_id"]] = r["status"]

        for z in zone_states:
            prev = self._prev_zone_status.get(z["zone_id"])
            if prev is not None and z["status"] != prev and ZONE_STATUS_RANK.get(z["status"], 0) > ZONE_STATUS_RANK.get(prev, 0):
                event_log.add(f"{z['name']} risk increased to {z['status']}", "FLOOD")
            self._prev_zone_status[z["zone_id"]] = z["status"]

        current_ids = {a["id"] for a in alerts}
        for a in alerts:
            if a["id"] not in self._prev_alert_ids:
                event_log.add(f"Emergency alert generated: {a['title']}" + (f" ({a['zone_id']})" if a["zone_id"] else ""), "ALERT")
        self._prev_alert_ids = current_ids


engine = ScenarioEngine()
