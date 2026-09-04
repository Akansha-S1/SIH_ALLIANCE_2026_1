import { useStore } from "../store/useStore";
import { fmt, statusColor } from "../utils/status";

function Card({ label, value, unit, color, sub }: { label: string; value: string; unit?: string; color?: string; sub?: string }) {
  return (
    <div className="flex-1 min-w-[130px] px-4 py-2.5 border-r border-panelborder last:border-r-0">
      <div className="text-[10px] font-semibold text-muted tracking-widest">{label}</div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-2xl font-extrabold mono" style={{ color: color || "#c9d6e8" }}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted font-medium">{unit}</span>}
      </div>
      {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export default function TopStatCards() {
  const live = useStore((s) => s.live);
  const s = live?.summary;

  return (
    <div className="flex items-stretch border-b border-panelborder bg-panel2 overflow-x-auto shrink-0">
      <Card label="DAM HEALTH" value={s ? fmt(s.dam_health, 0) : "—"} unit="/ 100" color={statusColor(s?.dam_health_label)} sub={s?.dam_health_label} />
      <Card label="FAILURE RISK" value={s ? fmt(s.failure_risk, 0) : "—"} unit="/ 100" color={statusColor(s?.failure_risk_level)} sub={s?.failure_risk_level} />
      <Card label="RESERVOIR LEVEL" value={s ? fmt(s.reservoir_level_pct, 1) : "—"} unit="%" />
      <Card label="FLOOD ARRIVAL" value={s?.flood_arrival_min != null ? fmt(s.flood_arrival_min, 0) : "—"} unit={s?.flood_arrival_min != null ? "min" : ""} sub={s?.worst_zone || undefined} />
      <Card label="POPULATION AT RISK" value={s ? fmt(s.population_at_risk, 0) : "—"} />
      <Card
        label="SAFETY MARGIN"
        value={s?.safety_margin_min != null ? fmt(s.safety_margin_min, 0) : "—"}
        unit={s?.safety_margin_min != null ? "min" : ""}
        color={s?.safety_margin_min != null && s.safety_margin_min < 15 ? "#ef4444" : undefined}
      />
    </div>
  );
}
