# Demo Script

This is the recommended judged-demo walkthrough (matches spec sections 28 & 43).

## Setup
1. Start the backend: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`
2. Start the frontend: `cd frontend && npm run dev`, open `http://localhost:5173`
3. Land on **Command Center** — the 3D digital twin, live stat cards (Dam Health, Failure Risk, Reservoir Level, Flood Arrival, Population at Risk, Safety Margin), the right-hand Live Risk Panel, and the bottom Event Timeline are all already live over the WebSocket.

## Walkthrough

| Step | Action | What to point out |
|---|---|---|
| 1 | Let it idle a few seconds on **NORMAL** | Dam Health ~95+, Failure Risk near 0, all sensor cards green, zero flood extent on the 3D map |
| 2 | Open **Dam Monitoring** | Ten live sensor cards with sparklines/trend arrows/status; Structural Health Analysis panel shows every contributing factor; Anomaly Detection panel (empty when nothing anomalous) |
| 3 | Back on Command Center, click **HEAVY RAINFALL** in the Scenario Simulator (bottom-left) | Rainfall + reservoir level sensors visibly rise on Dam Monitoring; event timeline logs the transition |
| 4 | Click **STRUCTURAL ANOMALY** | Pore pressure, deformation, seepage rise; Anomaly Detection fires (z-score); Dam Health drops into WARNING; Failure Risk rises with a visible weighted breakdown on **Risk Engine** |
| 5 | Click **MAJOR BREACH** | 3D map: translucent flood extent visibly expands from the dam downstream, growing zone by zone. Event timeline logs the breach, zone risk escalations, and road closures in real time |
| 6 | Open **Flood Prediction** | Per-zone table: flood depth, velocity, arrival time, exposed population, risk, evacuation status — Zone A/B escalate to CRITICAL first (closest to dam) |
| 7 | Open **Evacuation** | Roads table shows valley roads/the river-crossing bridge CLOSED while highland roads stay OPEN; the route planner shows CURRENT vs RECOMMENDED vs ALTERNATIVE routes rerouting around the closure |
| 8 | Open **Time-to-Safety** | Each affected zone's safety margin (arrival − travel time), colour-coded CRITICAL/HIGH RISK/WARNING/SAFE |
| 9 | Open **Shelters** | Capacity/occupancy/available bars, flood risk, and the zone → recommended-shelter table update live |
| 10 | Open **Alerts** | CRITICAL FLOOD ALERT cards per zone (arrival time, exposed population, recommended shelter/travel time/safety margin) plus a DAM STRUCTURAL WARNING / DAM FAILURE RISK ELEVATED alert |
| 11 | Open **3D Digital Twin** | Toggle map layers (flood / roads / shelters / infrastructure); click the dam box, a zone, a road, or a shelter pin to open its live detail panel |
| 12 | Open **Analytics** | Historical trend charts for every sensor, dam health, failure risk, population exposure, flood depth, shelter occupancy — collected since the simulation last started/reset |
| 13 | Click **RESET** | Everything returns to the NORMAL baseline in one click, ready to re-run |

Use **SPEED x5 / x10** at any point to accelerate the simulation clock for a faster live demo — the whole pipeline (sensors → flood → routing → alerts) scales with it.

## What's simulated vs. real

| Component | Status |
|---|---|
| Sensor readings | **Simulated** — `DemoSensorProvider`, a correlated stochastic model (see MODEL.md). Architecture is IoT-ready (`SensorProvider` interface has MQTT/REST/serial stubs) |
| Dam, zones, roads, shelters, infrastructure geography | **Fictional demo dataset** (`data/demo/*.json`) representing a plausible Himalayan-foothill river valley — not a real dam |
| Structural health / failure risk scoring | **Real, transparent rule-based model** running on the (simulated) sensor data — fully explainable, weights in one config file |
| Anomaly detection | **Real statistical method** (rolling z-score) running on live data |
| Flood propagation | **Simplified demo spatial model** (distance + elevation based) — explicitly not a validated hydrodynamic (HEC-RAS / shallow-water) simulation |
| Evacuation routing | **Real graph algorithm** (networkx shortest-path, flood-aware weighting) running on the demo road network |
| Alerts | **Simulated notification content only** — no real SMS/email/push is sent |
