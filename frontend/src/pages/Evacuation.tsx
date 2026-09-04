import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { api } from "../api/client";
import StatusPill from "../components/StatusPill";
import { fmt } from "../utils/status";

export default function Evacuation() {
  const live = useStore((s) => s.live);
  const [zoneId, setZoneId] = useState<string>("");
  const [routeInfo, setRouteInfo] = useState<any>(null);

  const zonesWithArrival = live?.zones.filter((z) => z.arrival_time_min != null) || [];

  useEffect(() => {
    if (!zoneId && zonesWithArrival.length > 0) setZoneId(zonesWithArrival[0].zone_id);
  }, [zonesWithArrival, zoneId]);

  useEffect(() => {
    if (!zoneId) return;
    api.routesForZone(zoneId).then(setRouteInfo).catch(() => setRouteInfo(null));
  }, [zoneId, live?.sim_minutes]);

  if (!live) return <div className="p-6 text-muted text-sm">Connecting…</div>;

  return (
    <div className="p-5 space-y-5">
      <h1 className="text-lg font-extrabold tracking-wide">DYNAMIC EVACUATION ROUTING</h1>

      <div className="rounded-sm border border-panelborder bg-panel2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted text-left border-b border-panelborder">
              <th className="p-3 font-semibold">Road</th>
              <th className="p-3 font-semibold">Distance</th>
              <th className="p-3 font-semibold">Travel Time</th>
              <th className="p-3 font-semibold">Flood Depth</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {live.roads.map((r) => (
              <tr key={r.road_id} className="border-b border-panelborder/50 last:border-0">
                <td className="p-3 font-semibold">{r.name}{r.is_bridge && <span className="text-muted"> (bridge)</span>}</td>
                <td className="p-3 mono">{fmt(r.distance_km, 1)} km</td>
                <td className="p-3 mono">{fmt(r.travel_time_min, 1)} min</td>
                <td className="p-3 mono">{fmt(r.flood_depth_m, 2)} m</td>
                <td className="p-3"><StatusPill status={r.status === "OPEN" ? "NORMAL" : r.status} small /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {zonesWithArrival.length > 0 && (
        <div className="rounded-sm border border-panelborder bg-panel2 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold tracking-wide">EVACUATION ROUTE PLANNER</h2>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="bg-panel border border-panelborder rounded px-2 py-1 text-xs">
              {zonesWithArrival.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>{z.name}</option>
              ))}
            </select>
          </div>

          {!routeInfo?.routes && <div className="text-xs text-muted">No active evacuation route computed for this zone.</div>}

          {routeInfo?.routes && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RouteCard title="CURRENT ROUTE" route={routeInfo.routes.current} note="pre-flood shortest path" />
              <RouteCard title="RECOMMENDED ROUTE" route={routeInfo.routes.recommended} note="safety + time + flood-exposure optimized" highlight />
              <RouteCard title="ALTERNATIVE ROUTE" route={routeInfo.routes.alternative} note="secondary safe path" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RouteCard({ title, route, note, highlight }: { title: string; route: any; note: string; highlight?: boolean }) {
  return (
    <div className={`rounded border p-3 ${highlight ? "border-accent bg-accent/5" : "border-panelborder"}`}>
      <div className={`text-[11px] font-bold tracking-widest mb-2 ${highlight ? "text-accent" : "text-muted"}`}>{title}</div>
      {route ? (
        <>
          <div className="text-xs mono mb-1">{route.nodes.join(" → ")}</div>
          <div className="text-sm font-extrabold">{route.travel_time_min} min</div>
        </>
      ) : (
        <div className="text-xs text-muted">No path available</div>
      )}
      <div className="text-[10px] text-muted mt-1">{note}</div>
    </div>
  );
}
