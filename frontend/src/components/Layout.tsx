import { NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "../store/useStore";
import RiskPanel from "./RiskPanel";
import EventStream from "./EventStream";
import TopStatCards from "./TopStatCards";

const NAV = [
  { to: "/", label: "Command Center", icon: "◈" },
  { to: "/monitoring", label: "Dam Monitoring", icon: "▤" },
  { to: "/twin", label: "3D Digital Twin", icon: "◎" },
  { to: "/flood", label: "Flood Prediction", icon: "≈" },
  { to: "/risk", label: "Risk Engine", icon: "⚠" },
  { to: "/safety", label: "Time-to-Safety", icon: "⏱" },
  { to: "/evacuation", label: "Evacuation", icon: "➟" },
  { to: "/shelters", label: "Shelters", icon: "⌂" },
  { to: "/alerts", label: "Alerts", icon: "☰" },
  { to: "/analytics", label: "Analytics", icon: "▥" },
];

export default function Layout() {
  const connect = useStore((s) => s.connect);
  const connected = useStore((s) => s.connected);
  const live = useStore((s) => s.live);

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#060a12] text-ink overflow-hidden">
      <header className="flex items-center justify-between px-4 h-14 border-b border-panelborder bg-panel shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center font-bold text-black text-sm">JR</div>
          <div>
            <div className="font-extrabold text-sm tracking-wide leading-none">JALRAKSHAK AI</div>
            <div className="text-[10px] text-muted tracking-widest leading-none mt-0.5">DAM BREAK FLOOD INTELLIGENCE</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="mono text-muted">DEMO MODE — SIMULATED SENSOR DATA</span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-safe pulse-dot" : "bg-critical"}`} />
            {connected ? "OPERATIONAL" : "RECONNECTING…"}
          </span>
          {live && <span className="mono text-muted">SIM T+{live.sim_minutes}min</span>}
        </div>
      </header>

      <TopStatCards />

      <div className="flex flex-1 min-h-0">
        <nav className="w-52 shrink-0 border-r border-panelborder bg-panel flex flex-col py-2 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium border-l-2 transition-colors ${
                  isActive ? "border-accent text-accent bg-accent/5" : "border-transparent text-muted hover:text-ink hover:bg-white/5"
                }`
              }
            >
              <span className="text-base w-4 text-center">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <Outlet />
          </div>
        </main>

        <aside className="w-72 shrink-0 border-l border-panelborder bg-panel overflow-y-auto">
          <RiskPanel />
        </aside>
      </div>

      <EventStream />
    </div>
  );
}
