import { useEffect, useState } from "react";
import { api } from "../api/client";
import HistoryChart from "../charts/HistoryChart";

const RANGES = ["1h", "6h", "24h", "7d"];

const CHARTS: { key: string; title: string; unit: string; color: string }[] = [
  { key: "dam_health", title: "Dam Health", unit: "score", color: "#22c55e" },
  { key: "failure_risk", title: "Failure Risk", unit: "score", color: "#ef4444" },
  { key: "water_level_pct", title: "Water Level", unit: "%", color: "#38bdf8" },
  { key: "rainfall_mm_hr", title: "Rainfall", unit: "mm/hr", color: "#0ea5e9" },
  { key: "pore_pressure_kpa", title: "Pore Pressure", unit: "kPa", color: "#f97316" },
  { key: "deformation_mm", title: "Deformation", unit: "mm", color: "#eab308" },
  { key: "concrete_strain", title: "Concrete Strain", unit: "ε", color: "#a78bfa" },
  { key: "seepage_lps", title: "Seepage", unit: "L/s", color: "#f59e0b" },
  { key: "crack_width_mm", title: "Crack Width", unit: "mm", color: "#ef4444" },
  { key: "population_at_risk", title: "Population Exposure", unit: "people", color: "#f97316" },
  { key: "flood_depth_max", title: "Peak Flood Depth", unit: "m", color: "#38bdf8" },
  { key: "shelter_occupancy_total", title: "Shelter Occupancy", unit: "people", color: "#22c55e" },
];

export default function Analytics() {
  const [range, setRange] = useState("1h");
  const [series, setSeries] = useState<Record<string, { t: number; v: number }[]>>({});

  useEffect(() => {
    const load = () => api.analyticsHistory().then((r) => setSeries(r.series)).catch(() => {});
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold tracking-wide">ANALYTICS</h1>
        <div className="flex items-center gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded border ${range === r ? "border-accent text-accent bg-accent/10" : "border-panelborder text-muted"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="text-[10px] text-muted">
        DEMO history — depth limited to the in-memory simulation buffer since last start/reset (not real multi-day historical data).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {CHARTS.map((c) => (
          <HistoryChart key={c.key} title={c.title} unit={c.unit} color={c.color} data={series[c.key] || []} />
        ))}
      </div>
    </div>
  );
}
