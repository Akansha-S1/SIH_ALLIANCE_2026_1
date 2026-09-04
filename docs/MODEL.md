# Models

Every model below is intentionally simple and fully explainable (spec §31/§32: no black-box claims, no fabricated accuracy numbers). All weights and thresholds live in `data/demo/model_config.json`.

## 1. Sensor simulation (`sensor_provider.py::DemoSensorProvider`)

A coupled stochastic model, not independent random noise. Each tick:
- **Rainfall** drifts toward a scenario-dependent target.
- **Reservoir level** integrates rainfall-driven inflow minus a managed release rate (minus a breach outflow term once a breach is triggered).
- **Reservoir pressure** tracks reservoir level directly.
- **Pore pressure** tracks reservoir level + rainfall infiltration + a scenario "anomaly forcing" term.
- **Concrete strain** and **deformation** track pore pressure + anomaly forcing (deformation also spikes hard once a breach starts).
- **Crack width** grows (mostly irreversibly) as a function of sustained deformation + anomaly forcing.
- **Seepage** tracks pore pressure + crack width.
- **Vibration** is baseline noise plus a breach-triggered spike.
- **Temperature** follows a slow diurnal sine wave plus noise.

This is why triggering `HEAVY_RAINFALL` visibly raises reservoir level, which raises pressure, which raises deformation/strain, which raises seepage/crack width — exactly the causal chain described in the spec, not six unrelated random walks.

## 2. Anomaly detection (`anomaly.py::ZScoreDetector`)

Rolling-window mean/standard-deviation z-score per sensor (window ≈ last 60 samples, minimum 12 samples before it activates). `|z| ≥ threshold` (default 2.5, configurable) flags an anomaly; severity bands on `|z|`: LOW < 3.5, MEDIUM < 5, HIGH ≥ 5. An `IsolationForestDetector` scaffold is included for a future multivariate ML upgrade once real historical data exists to fit it — not enabled by default, to keep the demo pipeline fully explainable.

## 3. Structural Health Score (`structural_health.py`)

```
score = 100 − Σ(status_deduction(sensor) × weight(sensor) × 100) − anomaly_penalty
```
`status_deduction` is 0 for NORMAL, 0.55 for WARNING, 1.0 for CRITICAL (per `model_config.json` thresholds). Bands: 92-100 NORMAL, 75-91 MONITOR, 50-74 WARNING, 25-49 HIGH RISK, 0-24 CRITICAL. Output includes every factor's exact point contribution.

## 4. Failure Risk Engine (`failure_risk.py`)

Nine named, weighted factors (weights in `model_config.json::failure_risk_weights`), each scaled 0-1 by how far the relevant sensor(s)/trend/health-deficit exceed their normal band, then summed and capped at 100:

`high_reservoir_level`, `rapid_level_rise`, `pore_pressure_anomaly`, `deformation_anomaly`, `crack_growth`, `seepage_increase`, `rainfall_intensity`, `vibration_anomaly`, `structural_health_deficit`.

Output includes the full itemised breakdown (used by the Risk Engine page) and a top-5 explanation list (used by alerts and the command-center decision panel) — exactly the "FAILURE RISK = 82, contributing factors: …" format from the spec.

## 5. Flood propagation (`flood_sim.py`)

**Explicitly a DEMO simplification, not a validated hydrodynamic model.** For each zone:
```
projected_depth = base_depth[breach_severity] × severity_multiplier × exp(-attenuation × distance_km)
avg_wave_speed  = base_speed × severity_multiplier × (1 − attenuation × distance_km)
arrival_time    = distance_km / avg_wave_speed × 60
current_depth   = projected_depth × ramp(elapsed_since_arrival, 10 min)
```
Road flooding is elevation-aware: a road only closes once the projected local *water-surface elevation* (`zone elevation + flood depth`) exceeds the road's own minimum elevation — so a highland evacuation road correctly stays open while a valley road/river-crossing bridge at the same or lower elevation floods and closes first (verified in `tests/test_flood_sim.py`).

## 6. Time-to-Safety (`time_to_safety.py`)

`margin = arrival_time − travel_time` (travel time from the live, flood-aware routing engine). Bands (configurable): <5min CRITICAL, 5–15min HIGH RISK, 15–30min WARNING, >30min SAFE.

## 7. Dynamic routing (`routing.py`)

`networkx` graph over the demo road network. Edge weight = travel time, plus a heavy penalty for AT_RISK roads; CLOSED roads are removed entirely. `find_routes()` returns the pre-flood **current** shortest path, the flood-aware **recommended** path, and a k=2 **alternative** path (`nx.shortest_simple_paths`) — so a closure is not just detected, it is routed around automatically every tick.

## 8. Shelter recommendation (`shelters.py`)

For each zone, scores every shelter with spare capacity by `travel_time + flood_risk_penalty + low_capacity_penalty` and picks the minimum — skipping full shelters even if they are closer.

## 9. Alerts (`alerts.py`)

Stateless per-tick generation from the above outputs: DAM_STRUCTURAL alerts from MEDIUM/HIGH anomalies and elevated failure risk; FLOOD alerts (EVACUATE) from HIGH/CRITICAL zone risk, carrying the recommended shelter/travel time/safety margin. The scenario engine diffs alert IDs tick-to-tick to log each alert exactly once to the event timeline.
