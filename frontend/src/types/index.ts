export type Status = "NORMAL" | "MONITOR" | "WARNING" | "HIGH" | "HIGH RISK" | "CRITICAL" | "SAFE" | "LOW" | "UNKNOWN";
export type Trend = "RISING" | "FALLING" | "STABLE";

export interface SensorCard {
  sensor_id: string;
  label: string;
  value: number;
  unit: string;
  trend: Trend;
  change_pct_10min: number;
  status: Status;
  normal_max: number;
  warning_max: number;
  sparkline: number[];
  source: "LIVE" | "CACHED" | "SIMULATED";
}

export interface HealthFactor {
  parameter: string;
  status: Status;
  contribution: number;
}

export interface DamHealth {
  score: number;
  label: string;
  factors: HealthFactor[];
}

export interface RiskFactor {
  factor: string;
  contribution: number;
}

export interface FailureRisk {
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: RiskFactor[];
  explanation: string[];
}

export interface AnomalyEvent {
  parameter: string;
  sensor_id: string;
  current: number;
  expected: number;
  deviation: number;
  zscore: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  timestamp: string;
}

export interface ZoneState {
  zone_id: string;
  name: string;
  lat: number;
  lon: number;
  population: number;
  exposed_population: number;
  flood_depth_m: number;
  flood_velocity_mps: number;
  arrival_time_min: number | null;
  risk_score: number;
  status: Status;
  evacuation_status: string;
  travel_time_min: number | null;
  safety_margin_min: number | null;
  tts_status: string;
  recommended_shelter: string | null;
  recommended_route: string[] | null;
}

export interface RoadState {
  road_id: string;
  name: string;
  start_node: string;
  end_node: string;
  distance_km: number;
  travel_time_min: number;
  flood_depth_m: number;
  status: "OPEN" | "AT_RISK" | "CLOSED";
  is_bridge: boolean;
  coordinates?: [number, number][];
}

export interface ShelterState {
  shelter_id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  occupancy: number;
  available: number;
  flood_risk: Status;
  status: string;
}

export interface Alert {
  id: string;
  category: "DAM_STRUCTURAL" | "FLOOD" | "EVACUATION";
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL";
  title: string;
  zone_id: string | null;
  message: string;
  details: Record<string, unknown>;
  recommended_action: string;
}

export interface SimEvent {
  id: number;
  timestamp: string;
  message: string;
  category: string;
}

export interface Summary {
  dam_health: number;
  dam_health_label: string;
  failure_risk: number;
  failure_risk_level: string;
  reservoir_level_pct: number;
  flood_arrival_min: number | null;
  population_at_risk: number;
  safety_margin_min: number | null;
  worst_zone: string | null;
  worst_zone_id: string | null;
  recommended_action: string;
  recommended_shelter: string | null;
}

export interface LiveState {
  type: string;
  timestamp: string;
  sim_minutes: number;
  scenario: string;
  running: boolean;
  speed: number;
  breach_stage: "NONE" | "PARTIAL" | "MAJOR";
  water_data_source: "LIVE" | "CACHED" | "SIMULATED";
  sensors: SensorCard[];
  dam_health: DamHealth;
  failure_risk: FailureRisk;
  anomalies: AnomalyEvent[];
  zones: ZoneState[];
  roads: RoadState[];
  shelters: ShelterState[];
  alerts: Alert[];
  events: SimEvent[];
  summary: Summary;
}

export interface DamInfo {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  elevation_m: number;
  crest_length_m: number;
  dam_height_m: number;
  max_water_level_m: number;
  reservoir_capacity_mcm: number;
  spillway_capacity_cumecs: number;
  commissioned: string;
  river: { name: string; path: [number, number][] };
}

export interface InfrastructureItem {
  id: string;
  type: "bridge" | "hospital" | "school" | "power";
  name: string;
  lat: number;
  lon: number;
  importance: string;
  near_zone?: string;
  related_road?: string;
}

export interface ZoneStatic {
  zone_id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_m: number;
  distance_from_dam_km: number;
  population: number;
  vulnerable_fraction: number;
}
