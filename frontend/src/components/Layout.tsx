import { NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { useThemeStore } from "../store/useThemeStore";
import RiskPanel from "./RiskPanel";
import EventStream from "./EventStream";
import TopStatCards from "./TopStatCards";
import DataSourceBadge from "./DataSourceBadge";

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
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const initTheme = useThemeStore((s) => s.init);

  useEffect(() => {
    connect();
    initTheme();
  }, [connect, initTheme]);

  return (
    <div className="h-screen w-screen flex flex-col bg-bg text-ink overflow-hidden">
      <header className="flex items-center justify-between px-4 h-12 border-b border-panelborder bg-panel shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-accent flex items-center justify-center font-bold text-panel text-xs">JR</div>
          <div>
            <div className="font-extrabold text-[13px] tracking-wide leading-none">JALRAKSHAK AI</div>
            <div className="text-[9px] text-muted tracking-widest leading-none mt-0.5">VALMIKINAGAR BARRAGE · GANDAK RIVER</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {live && <DataSourceBadge source={live.water_data_source} />}
          <span className="flex items-center gap-1.5 font-semibold">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-safe pulse-dot" : "bg-critical"}`} />
            {connected ? "OPERATIONAL" : "RECONNECTING…"}
          </span>
          {live && <span className="mono text-muted hidden sm:inline">SIM T+{live.sim_minutes}min</span>}
          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-sm border border-panelborder flex items-center justify-center text-sm hover:bg-white/5"
            title="Toggle light/dark theme"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
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
