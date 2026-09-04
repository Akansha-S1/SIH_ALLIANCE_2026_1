import Sparkline from "../components/Sparkline";
import StatusPill from "../components/StatusPill";
import DataSourceBadge from "../components/DataSourceBadge";
import { statusColor, fmt } from "../utils/status";
import type { SensorCard as SensorCardType } from "../types";

export default function SensorCard({ s }: { s: SensorCardType }) {
  const trendArrow = s.trend === "RISING" ? "↑" : s.trend === "FALLING" ? "↓" : "→";
  const trendColor = s.trend === "RISING" ? "#f97316" : s.trend === "FALLING" ? "#38bdf8" : "#7286a3";

  return (
    <div className="rounded-sm border border-panelborder bg-panel2 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wide text-muted uppercase">{s.label}</span>
        <div className="flex items-center gap-2">
          <DataSourceBadge source={s.source} small />
          <StatusPill status={s.status} small />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold mono" style={{ color: statusColor(s.status) }}>
            {fmt(s.value, s.value < 1 ? 5 : 2)}
          </span>
          <span className="text-xs text-muted">{s.unit}</span>
        </div>
        <Sparkline data={s.sparkline} color={statusColor(s.status)} />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span style={{ color: trendColor }} className="font-semibold">
          {trendArrow} {Math.abs(s.change_pct_10min)}% / 10min
        </span>
        <span className="text-muted">Normal &lt; {s.normal_max}</span>
      </div>
    </div>
  );
}
