import { useStore } from "../store/useStore";
import { api } from "../api/client";

const SCENARIOS = [
  { id: "NORMAL", label: "Normal" },
  { id: "HEAVY_RAINFALL", label: "Heavy Rainfall" },
  { id: "RAPID_RESERVOIR_RISE", label: "Rapid Reservoir Rise" },
  { id: "STRUCTURAL_ANOMALY", label: "Structural Anomaly" },
  { id: "PARTIAL_BREACH", label: "Partial Breach" },
  { id: "MAJOR_BREACH", label: "Major Dam Breach" },
];

const SPEEDS = [1, 5, 10];

export default function ScenarioControl() {
  const live = useStore((s) => s.live);
  const scenario = live?.scenario || "NORMAL";
  const running = live?.running ?? true;
  const speed = live?.speed ?? 1;

  return (
    <div className="rounded-md border border-panelborder bg-panel2 p-3">
      <div className="text-[10px] font-bold tracking-widest text-muted mb-2">DEMO SCENARIO SIMULATOR</div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => api.setScenario(s.id)}
            className={`text-[11px] font-semibold px-2 py-1.5 rounded border transition-colors ${
              scenario === s.id
                ? "border-accent bg-accent/15 text-accent"
                : "border-panelborder text-muted hover:text-ink hover:border-ink/30"
            } ${s.id === "MAJOR_BREACH" ? "col-span-2" : ""}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <button
          onClick={() => api.start()}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded border ${running ? "border-safe text-safe bg-safe/10" : "border-panelborder text-muted"}`}
        >
          ▶ START
        </button>
        <button
          onClick={() => api.pause()}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded border ${!running ? "border-warn text-warn bg-warn/10" : "border-panelborder text-muted"}`}
        >
          ⏸ PAUSE
        </button>
        <button onClick={() => api.reset()} className="flex-1 text-[11px] font-bold py-1.5 rounded border border-panelborder text-muted hover:text-critical hover:border-critical/50">
          ⟲ RESET
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted mr-1">SPEED</span>
        {SPEEDS.map((sp) => (
          <button
            key={sp}
            onClick={() => api.setSpeed(sp)}
            className={`flex-1 text-[11px] font-bold py-1 rounded border mono ${
              speed === sp ? "border-accent text-accent bg-accent/10" : "border-panelborder text-muted"
            }`}
          >
            x{sp}
          </button>
        ))}
      </div>
    </div>
  );
}
