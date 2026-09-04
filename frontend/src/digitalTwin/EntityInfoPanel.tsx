import type { ReactNode } from "react";
import { useStore } from "../store/useStore";
import StatusPill from "../components/StatusPill";
import { fmt } from "../utils/status";

export default function EntityInfoPanel() {
  const live = useStore((s) => s.live);
  const selectedEntity = useStore((s) => s.selectedEntity);
  const selectedZoneId = useStore((s) => s.selectedZoneId);
  const selectedRoadId = useStore((s) => s.selectedRoadId);
  const selectedShelterId = useStore((s) => s.selectedShelterId);
  const setSelectedZone = useStore((s) => s.setSelectedZone);
  const setSelectedRoad = useStore((s) => s.setSelectedRoad);
  const setSelectedShelter = useStore((s) => s.setSelectedShelter);

  if (!selectedEntity || !live) return null;

  const close = () => {
    setSelectedZone(null);
    setSelectedRoad(null);
    setSelectedShelter(null);
  };

  let body: ReactNode = null;
  let title = "";

  if (selectedEntity === "dam") {
    title = "DAM DIGITAL TWIN";
    body = (
      <>
        <Row label="Structural Health"><span>{fmt(live.dam_health.score, 0)}/100</span><StatusPill status={live.dam_health.label} small /></Row>
        <Row label="Failure Risk"><span>{fmt(live.failure_risk.score, 0)}/100</span><StatusPill status={live.failure_risk.level} small /></Row>
        {live.sensors.map((s) => (
          <Row key={s.sensor_id} label={s.label}>
            <span className="mono">{fmt(s.value, 3)} {s.unit}</span>
            <StatusPill status={s.status} small />
          </Row>
        ))}
      </>
    );
  } else if (selectedEntity === "zone" && selectedZoneId) {
    const z = live.zones.find((zz) => zz.zone_id === selectedZoneId);
    if (z) {
      title = z.name.toUpperCase();
      body = (
        <>
          <Row label="Population"><span>{fmt(z.population, 0)}</span></Row>
          <Row label="Exposed"><span>{fmt(z.exposed_population, 0)}</span></Row>
          <Row label="Flood depth"><span>{fmt(z.flood_depth_m, 2)} m</span></Row>
          <Row label="Arrival"><span>{z.arrival_time_min != null ? `${fmt(z.arrival_time_min, 0)} min` : "—"}</span></Row>
          <Row label="Risk"><span>{fmt(z.risk_score, 0)}</span><StatusPill status={z.status} small /></Row>
          <Row label="Evacuation"><span>{z.evacuation_status}</span></Row>
          <Row label="Safety margin"><span>{z.safety_margin_min != null ? `${fmt(z.safety_margin_min, 0)} min` : "—"}</span><StatusPill status={z.tts_status} small /></Row>
          <Row label="Shelter"><span>{z.recommended_shelter || "—"}</span></Row>
        </>
      );
    }
  } else if (selectedEntity === "road" && selectedRoadId) {
    const r = live.roads.find((rr) => rr.road_id === selectedRoadId);
    if (r) {
      title = r.name.toUpperCase();
      body = (
        <>
          <Row label="Travel time"><span>{fmt(r.travel_time_min, 1)} min</span></Row>
          <Row label="Distance"><span>{fmt(r.distance_km, 1)} km</span></Row>
          <Row label="Flood depth"><span>{fmt(r.flood_depth_m, 2)} m</span></Row>
          <Row label="Status"><StatusPill status={r.status} small /></Row>
          {r.is_bridge && <Row label="Type"><span>Bridge / River Crossing</span></Row>}
        </>
      );
    }
  } else if (selectedEntity === "shelter" && selectedShelterId) {
    const s = live.shelters.find((ss) => ss.shelter_id === selectedShelterId);
    if (s) {
      title = s.name.toUpperCase();
      body = (
        <>
          <Row label="Capacity"><span>{fmt(s.capacity, 0)}</span></Row>
          <Row label="Occupied"><span>{fmt(s.occupancy, 0)}</span></Row>
          <Row label="Available"><span>{fmt(s.available, 0)}</span></Row>
          <Row label="Flood risk"><StatusPill status={s.flood_risk} small /></Row>
          <Row label="Status"><span className="font-bold">{s.status}</span></Row>
        </>
      );
    }
  }

  if (!body) return null;

  return (
    <div className="absolute top-4 right-4 w-72 rounded-sm border border-panelborder bg-panel shadow-glow p-3 z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold tracking-widest text-accent">{title}</div>
        <button onClick={close} className="text-muted hover:text-ink text-sm leading-none">✕</button>
      </div>
      <div className="space-y-1.5">{body}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-panelborder/50 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-1.5">{children}</span>
    </div>
  );
}
