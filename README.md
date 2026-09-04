# JALRAKSHAK AI

**AI-Powered Dam Structural Health Monitoring, Dam-Break Flood Prediction, Time-to-Safety, Dynamic Evacuation and Emergency Response System.**

JALRAKSHAK AI is a working prototype of a professional emergency command-and-control platform for dam safety. It continuously monitors a dam via sensor data, estimates structural health and failure risk, simulates dam-break flood propagation, computes time-to-safety for downstream population zones, dynamically re-routes evacuation traffic around flooded roads, recommends shelters, and generates emergency alerts — end to end, in real time.

> **This is a DEMO / PROTOTYPE.** All sensor data is simulated, all engineering thresholds are illustrative demo configuration (not real dam-safety standards), and the flood model is a simplified spatial propagation model, not a validated hydrodynamic simulation. See [DEMO.md](docs/DEMO.md) and [MODEL.md](docs/MODEL.md) for exactly what is simulated vs. real.

## Pipeline

```
SENSOR LAYER → INGESTION → SENSOR PROCESSING → DAM DIGITAL TWIN
    → STRUCTURAL HEALTH ANALYSIS → FAILURE RISK ENGINE
    → FLOOD SIMULATION + RISK ENGINE → DOWNSTREAM RISK
    → TIME-TO-SAFETY → DYNAMIC ROUTE ENGINE → SHELTER ENGINE
    → ALERT ENGINE → COMMAND DASHBOARD
```

Every stage is implemented (not stubbed): see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start

**Backend** (FastAPI, Python 3.11+):
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Runs entirely in DEMO MODE — no database, API keys, or hardware required. Docs at `http://localhost:8000/docs`.

**Frontend** (React + TypeScript + Vite):
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. It connects to the backend over REST + `/ws/live` WebSocket.

Full walkthrough: [docs/DEMO.md](docs/DEMO.md).

## Tests
```bash
cd backend && source .venv/bin/activate && python -m pytest ../tests -q
```

## Repository layout

```
backend/        FastAPI app: risk engines, flood sim, routing, alerts, WebSocket, REST API
frontend/       React + TypeScript + Tailwind + Cesium command center UI
data/demo/      DEMO geospatial + sensor-threshold + model-weight configuration (JSON)
tests/          pytest suite for every engine in the pipeline
docs/           ARCHITECTURE.md, API.md, DEMO.md, DATA.md, MODEL.md
simulation/, models/, geospatial/  reserved for future real-data / trained-model integration
```

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — full pipeline, module map, how data flows
- [API.md](docs/API.md) — REST + WebSocket reference
- [DEMO.md](docs/DEMO.md) — step-by-step demo script (the judged scenario walkthrough)
- [DATA.md](docs/DATA.md) — demo dataset (dam, zones, roads, shelters) and how to swap in real data
- [MODEL.md](docs/MODEL.md) — structural health / failure risk / flood / anomaly model explainability and configuration
