import { useStore } from "../store/useStore";
import StatusPill from "../components/StatusPill";
import { fmt, statusColor } from "../utils/status";

export default function RiskEngine() {
  const live = useStore((s) => s.live);
  if (!live) return <div className="p-6 text-muted text-sm">Connecting…</div>;
  const fr = live.failure_risk;

  return (
    <div className="p-5 space-y-5">
      <h1 className="text-lg font-extrabold tracking-wide">AI FAILURE RISK ENGINE</h1>
      <p className="text-xs text-muted max-w-2xl">
        Transparent, rule-based weighted model — not a black box. Every point of risk score is
        traceable to a named contributing factor and its configured weight (data/demo/model_config.json).
        No unverified accuracy claims are made; this is a DEMO decision-support model.
      </p>

      <div className="rounded-md border border-panelborder bg-panel2 p-6 flex items-center gap-8">
        <div className="text-center">
          <div className="text-5xl font-extrabold mono" style={{ color: statusColor(fr.level) }}>{fmt(fr.score, 0)}</div>
          <div className="text-xs text-muted mt-1">FAILURE RISK / 100</div>
          <div className="mt-2"><StatusPill status={fr.level} /></div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-muted tracking-widest mb-2">MAIN CONTRIBUTING FACTORS</div>
          <ol className="space-y-1">
            {fr.explanation.map((e, i) => (
              <li key={e} className="text-sm flex items-center gap-2">
                <span className="text-accent font-bold mono">{i + 1}.</span> {e}
              </li>
            ))}
            {fr.explanation.length === 0 && <li className="text-sm text-muted">No significant risk drivers currently active.</li>}
          </ol>
        </div>
      </div>

      <div className="rounded-md border border-panelborder bg-panel2 p-4">
        <div className="text-xs font-bold text-muted tracking-widest mb-3">FULL WEIGHTED BREAKDOWN</div>
        <div className="space-y-2">
          {fr.factors.map((f) => (
            <div key={f.factor} className="flex items-center gap-3">
              <span className="text-xs w-56 shrink-0">{f.factor}</span>
              <div className="flex-1 h-2.5 bg-black/30 rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-critical" style={{ width: `${Math.min(100, f.contribution * 4)}%` }} />
              </div>
              <span className="text-xs mono w-12 text-right font-semibold">+{f.contribution}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted mt-4 pt-3 border-t border-panelborder">
          Sum of active factor contributions (capped at 100) = <span className="text-ink font-semibold">{fmt(fr.score, 1)}</span>
        </div>
      </div>

      <div className="rounded-md border border-panelborder bg-panel2 p-4">
        <div className="text-xs font-bold text-muted tracking-widest mb-3">MODEL ARCHITECTURE</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted">
          <div className="rounded border border-panelborder p-3">
            <div className="text-ink font-semibold mb-1">1. Rule-based structural score</div>
            Weighted deductions per sensor status band (transparent, human-auditable).
          </div>
          <div className="rounded border border-panelborder p-3">
            <div className="text-ink font-semibold mb-1">2. Statistical anomaly detection</div>
            Rolling mean/std z-score per sensor; Isolation Forest scaffold ready for real historical data.
          </div>
          <div className="rounded border border-panelborder p-3">
            <div className="text-ink font-semibold mb-1">3. ML-ready architecture</div>
            SensorProvider abstraction lets a trained model replace this scoring layer without touching downstream flood/routing/alerts.
          </div>
        </div>
      </div>
    </div>
  );
}
