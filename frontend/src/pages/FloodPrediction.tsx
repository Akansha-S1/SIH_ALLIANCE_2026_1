import { useStore } from "../store/useStore";
import StatusPill from "../components/StatusPill";
import { fmt } from "../utils/status";

export default function FloodPrediction() {
  const live = useStore((s) => s.live);
  if (!live) return <div className="p-6 text-muted text-sm">Connecting…</div>;

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold tracking-wide">FLOOD PREDICTION</h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold text-muted border border-panelborder rounded px-2 py-1">
            DEMO spatial propagation model — not a validated hydrodynamic simulation
          </span>
          <span className="text-xs font-bold mono">
            BREACH STAGE: <span className={live.breach_stage === "NONE" ? "text-safe" : live.breach_stage === "PARTIAL" ? "text-warn" : "text-critical"}>{live.breach_stage}</span>
          </span>
        </div>
      </div>

      <div className="rounded-md border border-panelborder bg-panel2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted text-left border-b border-panelborder">
              <th className="p-3 font-semibold">Zone</th>
              <th className="p-3 font-semibold">Population</th>
              <th className="p-3 font-semibold">Exposed</th>
              <th className="p-3 font-semibold">Flood Depth</th>
              <th className="p-3 font-semibold">Velocity</th>
              <th className="p-3 font-semibold">Arrival</th>
              <th className="p-3 font-semibold">Risk</th>
              <th className="p-3 font-semibold">Evacuation Status</th>
            </tr>
          </thead>
          <tbody>
            {live.zones.map((z) => (
              <tr key={z.zone_id} className="border-b border-panelborder/50 last:border-0">
                <td className="p-3 font-semibold">{z.name}</td>
                <td className="p-3 mono">{fmt(z.population, 0)}</td>
                <td className="p-3 mono">{fmt(z.exposed_population, 0)}</td>
                <td className="p-3 mono">{fmt(z.flood_depth_m, 2)} m</td>
                <td className="p-3 mono">{fmt(z.flood_velocity_mps, 2)} m/s</td>
                <td className="p-3 mono">{z.arrival_time_min != null ? `${fmt(z.arrival_time_min, 0)} min` : "—"}</td>
                <td className="p-3"><StatusPill status={z.status} small /></td>
                <td className="p-3">{z.evacuation_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-sm font-bold tracking-wide mb-2">INFRASTRUCTURE STATUS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {live.roads.filter((r) => r.is_bridge || r.status !== "OPEN").map((r) => (
            <div key={r.road_id} className="rounded border border-panelborder bg-panel2 p-3">
              <div className="text-xs font-bold mb-1">{r.name}</div>
              <StatusPill status={r.status === "OPEN" ? "NORMAL" : r.status} small />
              {r.flood_depth_m > 0 && <div className="text-[11px] text-muted mt-1">Depth: {fmt(r.flood_depth_m, 2)} m</div>}
            </div>
          ))}
          {live.roads.every((r) => !r.is_bridge && r.status === "OPEN") && (
            <div className="text-xs text-muted col-span-4">All roads and bridges currently open.</div>
          )}
        </div>
      </div>
    </div>
  );
}
