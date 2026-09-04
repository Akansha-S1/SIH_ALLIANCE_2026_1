import type { ReactNode } from "react";
import { useStore } from "../store/useStore";
import StatusPill from "../components/StatusPill";
import { fmt } from "../utils/status";

export default function TimeToSafety() {
  const live = useStore((s) => s.live);
  if (!live) return <div className="p-6 text-muted text-sm">Connecting…</div>;
  const zones = live.zones.filter((z) => z.arrival_time_min != null);

  return (
    <div className="p-5 space-y-5">
      <h1 className="text-lg font-extrabold tracking-wide">TIME-TO-SAFETY ENGINE</h1>
      <p className="text-xs text-muted max-w-2xl mono">
        TIME TO SAFETY = FLOOD ARRIVAL TIME − EVACUATION TRAVEL TIME (via the dynamic routing engine)
      </p>

      {zones.length === 0 && <div className="text-sm text-muted">No active flood threat — all zones safe.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {zones.map((z) => (
          <div key={z.zone_id} className="rounded-sm border border-panelborder bg-panel2 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold">{z.name}</span>
              <StatusPill status={z.tts_status} small />
            </div>
            <div className="space-y-1.5 text-xs">
              <Row label="Flood arrival">{fmt(z.arrival_time_min, 0)} min</Row>
              <Row label="Travel time">{z.travel_time_min != null ? `${fmt(z.travel_time_min, 0)} min` : "no route"}</Row>
              <div className="h-px bg-panelborder my-2" />
              <Row label="Safety margin">
                <span
                  className="font-extrabold text-base"
                  style={{ color: z.safety_margin_min != null && z.safety_margin_min < 5 ? "#ef4444" : z.safety_margin_min != null && z.safety_margin_min < 15 ? "#f97316" : "#22c55e" }}
                >
                  {z.safety_margin_min != null ? `${fmt(z.safety_margin_min, 0)} min` : "—"}
                </span>
              </Row>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-sm border border-panelborder bg-panel2 p-4 text-xs text-muted">
        <div className="text-ink font-semibold mb-1">Configurable bands (demo thresholds)</div>
        &lt;5min CRITICAL · 5–15min HIGH RISK · 15–30min WARNING · &gt;30min SAFE
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}
