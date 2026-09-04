import { useStore } from "../store/useStore";
import { severityColor } from "../utils/status";

const CATEGORY_COLOR: Record<string, string> = {
  SYSTEM: "#7286a3",
  SCENARIO: "#22d3ee",
  SENSOR: "#94a3b8",
  STRUCTURAL: "#eab308",
  RISK: "#f97316",
  BREACH: "#ef4444",
  FLOOD: "#38bdf8",
  ROUTE: "#a78bfa",
  ALERT: "#ef4444",
};

export default function EventStream() {
  const live = useStore((s) => s.live);
  const events = live?.events || [];

  return (
    <div className="h-32 shrink-0 border-t border-panelborder bg-panel flex flex-col">
      <div className="px-4 py-1.5 text-[10px] font-bold tracking-widest text-muted border-b border-panelborder/60">LIVE EVENT TIMELINE</div>
      <div className="flex-1 overflow-y-auto px-4 py-1.5 space-y-1">
        {events.length === 0 && <div className="text-xs text-muted">No events yet.</div>}
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-xs mono">
            <span className="text-muted w-16 shrink-0">{e.timestamp}</span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[e.category] || severityColor(e.category) }} />
            <span className="text-ink">{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
