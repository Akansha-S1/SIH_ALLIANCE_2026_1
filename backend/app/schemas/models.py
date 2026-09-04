"""
Pydantic schema definitions for JALRAKSHAK AI.

These describe the shape of the domain entities that flow through the
system (SensorReading, DamHealth, RiskAssessment, FloodZone, Road, Shelter,
Infrastructure, Alert, SimulationEvent). In DEMO MODE these are populated
by the in-memory simulation engine (see app/services/*). A production
deployment would back the same shapes with PostgreSQL/PostGIS tables --
the field names here double as the intended column names.
"""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel

Status = Literal["NORMAL", "MONITOR", "WARNING", "HIGH RISK", "CRITICAL", "UNKNOWN"]
Trend = Literal["RISING", "FALLING", "STABLE"]


class SensorReading(BaseModel):
    sensor_id: str
    label: str
    value: float
    unit: str
    trend: Trend
    change_pct_10min: float
    status: Status
    normal_max: float
    warning_max: float
    history: list[float] = []


class AnomalyEvent(BaseModel):
    parameter: str
    current: float
    expected: float
    deviation: float
    zscore: float
    severity: Literal["LOW", "MEDIUM", "HIGH"]
    timestamp: str


class HealthFactor(BaseModel):
    parameter: str
    status: Status
    contribution: float


class DamHealth(BaseModel):
    score: float
    label: str
    factors: list[HealthFactor]


class RiskFactor(BaseModel):
    factor: str
    contribution: float


class FailureRisk(BaseModel):
    score: float
    level: str
    factors: list[RiskFactor]
    explanation: list[str]


class FloodZoneState(BaseModel):
    zone_id: str
    name: str
    lat: float
    lon: float
    population: int
    exposed_population: int
    flood_depth_m: float
    flood_velocity_mps: float
    arrival_time_min: Optional[float]
    risk_score: float
    status: Status
    evacuation_status: str
    travel_time_min: Optional[float]
    safety_margin_min: Optional[float]
    tts_status: str
    recommended_shelter: Optional[str]
    recommended_route: Optional[list[str]]


class RoadState(BaseModel):
    road_id: str
    name: str
    start_node: str
    end_node: str
    distance_km: float
    travel_time_min: float
    flood_depth_m: float
    status: Literal["OPEN", "AT_RISK", "CLOSED"]
    is_bridge: bool


class ShelterState(BaseModel):
    shelter_id: str
    name: str
    lat: float
    lon: float
    capacity: int
    occupancy: int
    available: int
    flood_risk: Status
    status: str


class Alert(BaseModel):
    id: str
    timestamp: str
    category: Literal["DAM_STRUCTURAL", "FLOOD", "EVACUATION"]
    severity: Literal["INFO", "WARNING", "HIGH", "CRITICAL"]
    title: str
    zone_id: Optional[str] = None
    message: str
    details: dict[str, Any] = {}
    recommended_action: str


class SimulationEvent(BaseModel):
    timestamp: str
    message: str
    category: str


class ScenarioControl(BaseModel):
    scenario: Optional[str] = None
    speed: Optional[float] = None
