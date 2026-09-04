import { useStore } from "../store/useStore";
import StatusPill from "../components/StatusPill";
import { fmt } from "../utils/status";

export default function Shelters() {
  const live = useStore((s) => s.live);
  if (!live) return <div className="p-6 text-muted text-sm">Connecting…</div>;

  return (
    <div className="p-5 space-y-5">
      <h1 className="text-lg font-extrabold tracking-wide">SHELTER ENGINE</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {live.shelters.map((s) => {
          const pct = Math.round((s.occupancy / s.capacity) * 100);
          return (
            <div key={s.shelter_id} className="rounded-sm border border-panelborder bg-panel2 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{s.name}</span>
                <StatusPill status={s.status === "FULL" ? "CRITICAL" : "NORMAL"} small />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <div className="text-lg font-extrabold mono">{fmt(s.capacity, 0)}</div>
                  <div className="text-[10px] text-muted">CAPACITY</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold mono">{fmt(s.occupancy, 0)}</div>
                  <div className="text-[10px] text-muted">OCCUPIED</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold mono text-accent">{fmt(s.available, 0)}</div>
                  <div className="text-[10px] text-muted">AVAILABLE</div>
                </div>
              </div>
              <div className="h-2 bg-black/30 rounded overflow-hidden mb-3">
                <div className={`h-full ${pct > 90 ? "bg-critical" : pct > 70 ? "bg-warn" : "bg-safe"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Flood risk</span>
                <StatusPill status={s.flood_risk} small />
              </div>
              <div className="mt-3 pt-2 border-t border-panelborder text-center text-xs font-bold" style={{ color: s.status === "FULL" ? "#ef4444" : "#22c55e" }}>
                {s.status}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-sm border border-panelborder bg-panel2 p-4">
        <h2 className="text-sm font-bold tracking-wide mb-3">ZONE → RECOMMENDED SHELTER</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted text-left border-b border-panelborder">
              <th className="p-2 font-semibold">Zone</th>
              <th className="p-2 font-semibold">Recommended Shelter</th>
              <th className="p-2 font-semibold">Travel Time</th>
            </tr>
          </thead>
          <tbody>
            {live.zones.map((z) => (
              <tr key={z.zone_id} className="border-b border-panelborder/50 last:border-0">
                <td className="p-2 font-semibold">{z.name}</td>
                <td className="p-2">{z.recommended_shelter || "—"}</td>
                <td className="p-2 mono">{z.travel_time_min != null ? `${fmt(z.travel_time_min, 0)} min` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
