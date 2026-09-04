import type { ReactNode } from "react";
import { useStore } from "../store/useStore";
import StatusPill from "./StatusPill";
import { fmt, statusColor } from "../utils/status";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-panelborder/60">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-semibold">{children}</span>
    </div>
  );
}

export default function RiskPanel() {
  const live = useStore((s) => s.live);
  const s = live?.summary;

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <div className="text-xs font-bold tracking-widest text-muted mb-2">LIVE RISK PANEL</div>
        {!live && <div className="text-xs text-muted">Connecting to simulation…</div>}
        {live && (
          <div>
            <Row label="Dam health">
              <span style={{ color: statusColor(s?.dam_health_label) }}>{fmt(s?.dam_health, 0)}/100 · {s?.dam_health_label}</span>
            </Row>
            <Row label="Failure risk">
              <span style={{ color: statusColor(s?.failure_risk_level) }}>{fmt(s?.failure_risk, 0)}/100 · {s?.failure_risk_level}</span>
            </Row>
            <Row label="Flood arrival">{s?.flood_arrival_min != null ? `${fmt(s.flood_arrival_min, 0)} min` : "—"}</Row>
            <Row label="Population risk">{fmt(s?.population_at_risk, 0)}</Row>
            <Row label="Time-to-Safety">
              {s?.safety_margin_min != null ? (
                <span style={{ color: s.safety_margin_min < 15 ? "#ef4444" : s.safety_margin_min < 30 ? "#eab308" : "#22c55e" }}>
                  {fmt(s.safety_margin_min, 0)} min
                </span>
              ) : (
                "—"
              )}
            </Row>
          </div>
        )}
      </div>

      {live && (
        <div className="rounded-sm border border-panelborder bg-panel2 p-3">
          <div className="text-[10px] font-bold tracking-widest text-muted mb-1.5">CURRENT SITUATION</div>
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted">Dam</span><StatusPill status={s?.dam_health_label || "NORMAL"} small /></div>
            <div className="flex justify-between"><span className="text-muted">Failure Risk</span><StatusPill status={s?.failure_risk_level || "LOW"} small /></div>
            {s?.worst_zone && <div className="flex justify-between"><span className="text-muted">Flood Zone</span><span className="font-semibold">{s.worst_zone}</span></div>}
          </div>
          <div className="mt-3 pt-3 border-t border-panelborder">
            <div className="text-[10px] font-bold tracking-widest text-muted mb-1">RECOMMENDED ACTION</div>
            <div className="text-sm font-bold text-accent leading-snug">{s?.recommended_action}</div>
          </div>
          {s?.recommended_shelter && (
            <div className="mt-2 text-xs">
              <span className="text-muted">Recommended Shelter: </span>
              <span className="font-semibold">{s.recommended_shelter}</span>
            </div>
          )}
        </div>
      )}

      {live && live.anomalies.length > 0 && (
        <div>
          <div className="text-xs font-bold tracking-widest text-muted mb-2">ANOMALY DETECTIONS</div>
          <div className="space-y-2">
            {live.anomalies.slice(0, 4).map((a) => (
              <div key={a.sensor_id} className="rounded border border-panelborder bg-panel2 p-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{a.parameter}</span>
                  <StatusPill status={a.severity === "HIGH" ? "CRITICAL" : a.severity === "MEDIUM" ? "WARNING" : "MONITOR"} small />
                </div>
                <div className="text-muted mt-1">
                  Current {fmt(a.current, 3)} vs expected {fmt(a.expected, 3)} ({a.deviation > 0 ? "+" : ""}{fmt(a.deviation, 3)})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
