# Architecture

## Pipeline overview

```
SENSOR LAYER (Water / Structural / Environmental)
        │
REAL-TIME DATA INGESTION  ─── app/services/sensor_provider.py (SensorProvider abstraction)
        │
SENSOR PROCESSING          ─── app/services/sensor_status.py, app/services/anomaly.py
        │
DAM DIGITAL TWIN           ─── frontend CesiumJS scene, backed by /api/dam/* + /ws/live
        │
STRUCTURAL HEALTH ANALYSIS ─── app/services/structural_health.py
        │
FAILURE RISK ENGINE        ─── app/services/failure_risk.py
        │
   ┌────┴────┐
   ▼         ▼
FLOOD SIM   (risk feeds both branches)
app/services/flood_sim.py
   │
DOWNSTREAM RISK (per-zone) ─── flood_sim.simulate_zones()
        │
TIME-TO-SAFETY              ─── app/services/time_to_safety.py
        │
DYNAMIC ROUTE ENGINE        ─── app/services/routing.py (networkx)
        │
SHELTER ENGINE               ─── app/services/shelters.py
        │
ALERT ENGINE                  ─── app/services/alerts.py
        │
COMMAND DASHBOARD            ─── frontend/src (React), fed by REST + WebSocket
```

All of the above are tied together every simulation tick by `app/services/scenario_engine.py::ScenarioEngine.tick()`, which is the single place that calls each stage in order and broadcasts the resulting consolidated state over WebSocket.

## Backend module map

| Module | Responsibility |
|---|---|
| `app/config.py` | Loads `data/demo/*.json` (thresholds, weights, geography) once at startup |
| `app/services/sensor_provider.py` | `SensorProvider` abstract interface + `DemoSensorProvider` (correlated stochastic simulation). Stubs for `MQTTSensorProvider`, `RestPollSensorProvider`, `SerialSensorProvider` show where real hardware plugs in |
| `app/services/sensor_status.py` | Per-sensor status (NORMAL/WARNING/CRITICAL), trend, sparkline data for dashboard cards |
| `app/services/anomaly.py` | `ZScoreDetector` (rolling mean/std z-score, explainable). `IsolationForestDetector` scaffold for a future ML upgrade |
| `app/services/structural_health.py` | Weighted, explainable 0–100 Dam Health Score |
| `app/services/failure_risk.py` | Weighted, explainable 0–100 Failure Risk Score with itemised contributing factors |
| `app/services/flood_sim.py` | DEMO spatial flood propagation model (distance + elevation based, not a hydrodynamic solver) |
| `app/services/routing.py` | `networkx`-based road graph; flood-aware dynamic shortest-path routing |
| `app/services/shelters.py` | Shelter state + recommendation (capacity, flood risk, travel time) |
| `app/services/time_to_safety.py` | `arrival_time − travel_time` → safety margin + status band |
| `app/services/alerts.py` | Generates structural + flood alert objects (no real SMS/email is sent) |
| `app/services/event_log.py` | Ring-buffer live event timeline |
| `app/services/scenario_engine.py` | Orchestrates the full tick, scenario state machine, playback controls, historical series for analytics |
| `app/websocket/manager.py` | WebSocket connection manager for `/ws/live` |
| `app/api/*.py` | REST endpoints (see [API.md](API.md)) |

## Frontend module map

| Path | Responsibility |
|---|---|
| `src/store/useStore.ts` | Zustand store; owns the WebSocket connection and the single consolidated `live` state object |
| `src/api/client.ts` | REST client (static geo fetches, simulation controls) |
| `src/map/CesiumMap.tsx` | CesiumJS 3D digital twin: dam, reservoir, river, zones, roads, shelters, infrastructure, animated flood extents, click-to-inspect |
| `src/digitalTwin/EntityInfoPanel.tsx` | Detail panel shown when the dam / a zone / a road / a shelter is clicked on the map |
| `src/components/Layout.tsx` | EOC shell: header, left nav, top stat cards, right live-risk panel, bottom event timeline |
| `src/components/ScenarioControl.tsx` | Scenario buttons + start/pause/reset/speed controls |
| `src/pages/*.tsx` | Command Center, Dam Monitoring, 3D Digital Twin, Flood Prediction, Risk Engine, Time-to-Safety, Evacuation, Shelters, Alerts, Analytics |
| `src/charts/HistoryChart.tsx` | Recharts wrapper used by the Analytics page |

## Data flow (one tick)

1. `DemoSensorProvider.tick()` advances every sensor by one time step using a coupled stochastic model driven by the active scenario.
2. `ZScoreDetector.detect_all()` flags statistically anomalous sensors.
3. `compute_health()` turns sensor status + anomalies into a 0–100 Dam Health Score with itemised factors.
4. `compute_failure_risk()` turns sensor values, trends, health and anomalies into a 0–100 Failure Risk Score with weighted, named contributing factors.
5. `simulate_zones()` propagates a flood (if a breach scenario is active) to each downstream zone, producing depth/velocity/arrival-time/risk/exposed-population.
6. `flood_depth_at_road()` + `build_road_states()` derive live road status (OPEN/AT_RISK/CLOSED) from zone flood depth vs. each road's elevation.
7. `find_routes()` recomputes current/recommended/alternative evacuation paths on the live road graph.
8. `recommend_shelter_for_zone()` picks the best reachable shelter per zone.
9. `compute_time_to_safety()` derives the safety margin per zone.
10. `generate_alerts()` produces structural + flood alert objects.
11. Every meaningful state transition is appended to the event log.
12. The consolidated state is broadcast to all WebSocket clients and is also queryable via REST.

## Why DEMO MODE has no database

The spec requires the app to run out-of-the-box with no external services. All "state" is either (a) static reference geography in `data/demo/*.json`, loaded once, or (b) the live simulation state held in-process by `ScenarioEngine`. The Pydantic schemas in `backend/app/schemas/models.py` double as the intended table/column design for a real PostgreSQL/PostGIS deployment (see section 33 of the original spec and [DATA.md](DATA.md)) — swapping in a real database means writing a repository layer behind the same shapes, not redesigning the pipeline.
