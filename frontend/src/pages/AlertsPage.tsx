import { useStore } from "../store/useStore";
import { severityColor } from "../utils/status";

export default function AlertsPage() {
  const live = useStore((s) => s.live);
  if (!live) return <div className="p-6 text-muted text-sm">Connecting…</div>;

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold tracking-wide">EMERGENCY ALERTS</h1>
        <span className="text-[10px] font-semibold text-muted border border-panelborder rounded px-2 py-1">
          SIMULATED NOTIFICATIONS — no real SMS/email is sent in this prototype
        </span>
      </div>

      {live.alerts.length === 0 && <div className="text-sm text-muted">No active alerts. System operating normally.</div>}

      <div className="space-y-3">
        {live.alerts.map((a) => (
          <div key={a.id} className="rounded-md border p-4" style={{ borderColor: severityColor(a.severity) + "77", background: severityColor(a.severity) + "0d" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sm" style={{ color: severityColor(a.severity) }}>
                {a.severity === "CRITICAL" ? "🚨 " : "⚠ "} {a.title}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: severityColor(a.severity), background: severityColor(a.severity) + "22" }}>
                {a.severity}
              </span>
            </div>
            {a.zone_id && <div className="text-xs text-muted mb-1">ZONE: {a.zone_id.toUpperCase()}</div>}
            <div className="text-sm mb-3">{a.message}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mono">
              {Object.entries(a.details).map(([k, v]) =>
                v !== null && v !== undefined ? (
                  <div key={k}>
                    <div className="text-muted uppercase text-[10px]">{k.replace(/_/g, " ")}</div>
                    <div className="font-semibold">{String(v)}</div>
                  </div>
                ) : null
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 text-xs">
              <span className="text-muted">Action: </span>
              <span className="font-bold" style={{ color: severityColor(a.severity) }}>{a.recommended_action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
