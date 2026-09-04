# Data

## Demo dataset (`data/demo/*.json`)

All fictional, hand-authored for this prototype (a plausible Himalayan-foothill river valley — **not** a real dam or real place):

| File | Contents |
|---|---|
| `dam.json` | Dam identity/geometry, reservoir capacity, spillway capacity, river centerline path |
| `zones.json` | 4 downstream population zones: id, name, lat/lon, elevation, distance from dam, population, vulnerable fraction |
| `roads.json` | 12-edge road graph connecting dam → zones → shelters, with distance, speed, minimum elevation (used for flood-based closure), bridge flag |
| `shelters.json` | 4 shelters: location, elevation, capacity, baseline occupancy |
| `infrastructure.json` | Hospitals, schools, a bridge, a power substation (points shown on the map, referenced by alerts) |
| `model_config.json` | **All configurable thresholds and weights in one place**: sensor normal/warning bands, structural-health weights + bands, failure-risk weights + bands, time-to-safety bands, flood-model constants, anomaly z-score threshold |

Every threshold/weight file carries an explicit `_note` field stating it is DEMO configuration, not a real engineering standard.

## Sensor CSV shape (matches spec §30)

The live simulator's per-tick reading is exactly this record shape (see `app/services/sensor_provider.py::_SensorState`):

```
timestamp, water_level_pct, water_level_m, rainfall_mm_hr, reservoir_pressure_kpa,
pore_pressure_kpa, concrete_strain, deformation_mm, crack_width_mm,
seepage_lps, vibration_g, temperature_c
```

## Swapping in real data

- **Real sensors**: implement `SensorProvider.read()`/`tick()`/`history()` against MQTT/REST/serial (stub classes already scaffolded in `sensor_provider.py`) and swap it in for `DemoSensorProvider` in `scenario_engine.py`. Nothing downstream changes — every consumer only depends on the `dict[str, float]` shape `SensorProvider` returns.
- **Real geography**: replace `data/demo/*.json` with real GeoJSON/CSV exports (e.g. from GeoPandas/Shapely processing of DEM + population + road datasets) that match the same field names; `app/config.py` is the single loader to point at a different source (or a PostGIS-backed repository).
- **Real database**: the Pydantic models in `backend/app/schemas/models.py` (`SensorReading`, `DamHealth`, `RiskAssessment`/`FailureRisk`, `FloodZoneState`, `RoadState`, `ShelterState`, `Alert`, `SimulationEvent`) are the intended PostgreSQL/PostGIS table shapes — add a repository layer behind `app/config.py`'s accessors rather than redesigning the pipeline.
