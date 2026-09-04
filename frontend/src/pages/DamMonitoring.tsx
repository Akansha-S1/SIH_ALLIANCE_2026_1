import { useStore } from "../store/useStore";
import SensorCard from "../dashboard/SensorCard";
import StatusPill from "../components/StatusPill";
import { fmt, statusColor } from "../utils/status";

export default function DamMonitoring() {
  const live = useStore((s) => s.live);

  if (!live) return <div className="p-6 text-muted text-sm">Connecting to sensor feed…</div>;

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold tracking-wide">DAM SENSOR MONITORING</h1>
        <span className="text-[10px] font-semibold text-muted border border-panelborder rounded px-2 py-1">
          DEMO / SIMULATED SENSOR DATA — replace with live IoT feed in production
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {live.sensors.map((s) => (
          <SensorCard key={s.sensor_id} s={s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border border-panelborder bg-panel2 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold tracking-wide">STRUCTURAL HEALTH ANALYSIS</h2>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold mono" style={{ color: statusColor(live.dam_health.label) }}>
                {fmt(live.dam_health.score, 0)}/100
              </span>
              <StatusPill status={live.dam_health.label} />
            </div>
          </div>
          <div className="space-y-1.5">
            {live.dam_health.factors.map((f) => (
              <div key={f.parameter} className="flex items-center justify-between text-xs py-1 border-b border-panelborder/50 last:border-0">
                <span className="text-muted">{f.parameter}</span>
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px]">{f.contribution}</span>
                  <StatusPill status={f.status} small />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-panelborder bg-panel2 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold tracking-wide">ANOMALY DETECTION</h2>
            <span className="text-[10px] text-muted">rolling z-score, window≈60 samples</span>
          </div>
          {live.anomalies.length === 0 && <div className="text-xs text-muted">No anomalies detected — all sensors within expected statistical range.</div>}
          <div className="space-y-2">
            {live.anomalies.map((a) => (
              <div key={a.sensor_id} className="rounded border border-panelborder p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">ANOMALY DETECTED — {a.parameter}</span>
                  <StatusPill status={a.severity === "HIGH" ? "CRITICAL" : a.severity === "MEDIUM" ? "WARNING" : "MONITOR"} small />
                </div>
                <div className="grid grid-cols-3 gap-2 mono text-[11px] text-muted">
                  <span>Current: <span className="text-ink">{fmt(a.current, 4)}</span></span>
                  <span>Expected: <span className="text-ink">{fmt(a.expected, 4)}</span></span>
                  <span>Deviation: <span className="text-ink">{a.deviation > 0 ? "+" : ""}{fmt(a.deviation, 4)}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-panelborder bg-panel2 p-4">
        <h2 className="text-sm font-bold tracking-wide mb-3">DAM FAILURE RISK BREAKDOWN</h2>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-3xl font-extrabold mono" style={{ color: statusColor(live.failure_risk.level) }}>
            {fmt(live.failure_risk.score, 0)}
          </span>
          <div>
            <StatusPill status={live.failure_risk.level} />
            <div className="text-[10px] text-muted mt-1">Failure Risk / 100 · weights configured in model_config.json</div>
          </div>
        </div>
        <div className="space-y-1">
          {live.failure_risk.factors.map((f) => (
            <div key={f.factor} className="flex items-center gap-2">
              <span className="text-xs w-52 text-muted shrink-0">{f.factor}</span>
              <div className="flex-1 h-2 bg-black/30 rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-critical" style={{ width: `${Math.min(100, f.contribution * 4)}%` }} />
              </div>
              <span className="text-xs mono w-10 text-right">+{f.contribution}</span>
            </div>
          ))}
          {live.failure_risk.factors.length === 0 && <div className="text-xs text-muted">No significant risk factors currently active.</div>}
        </div>
      </div>
    </div>
  );
}
