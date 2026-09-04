import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { api } from "../api/client";

type Level = "critical" | "high" | "warning" | "monitor" | "normal";

function levelFor(summary: any): { level: Level; heading: string; action: string } {
  if (!summary) return { level: "normal", heading: "CONNECTING…", action: "" };
  const margin = summary.safety_margin_min;
  if (margin != null) {
    if (margin < 5) return { level: "critical", heading: "🚨 FLOOD ALERT", action: "EVACUATE NOW" };
    if (margin < 15) return { level: "critical", heading: "🚨 FLOOD ALERT", action: "EVACUATE NOW" };
    if (margin < 30) return { level: "high", heading: "⚠ FLOOD WARNING", action: "PREPARE TO EVACUATE" };
    return { level: "warning", heading: "⚠ FLOOD WATCH", action: "MONITOR SITUATION" };
  }
  if (summary.failure_risk_level === "HIGH" || summary.failure_risk_level === "CRITICAL") {
    return { level: "monitor", heading: "DAM UNDER MONITORING", action: "STAY ALERT" };
  }
  return { level: "normal", heading: "ALL CLEAR", action: "NO ACTION NEEDED" };
}

const LEVEL_STYLE: Record<Level, { bg: string; fg: string; pulse: boolean }> = {
  critical: { bg: "#7f1d1d", fg: "#fef2f2", pulse: true },
  high: { bg: "#7c2d12", fg: "#fff7ed", pulse: true },
  warning: { bg: "#78350f", fg: "#fffbeb", pulse: false },
  monitor: { bg: "#713f12", fg: "#fefce8", pulse: false },
  normal: { bg: "#052e16", fg: "#f0fdf4", pulse: false },
};

function beep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain).connect(ctx.destination);
      const start = ctx.currentTime + i * 0.35;
      osc.start(start);
      osc.stop(start + 0.22);
    }
  } catch {
    /* audio unavailable */
  }
}

export default function CitizenView() {
  const connect = useStore((s) => s.connect);
  const connected = useStore((s) => s.connected);
  const live = useStore((s) => s.live);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const prevLevel = useRef<Level | null>(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    connect();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [connect]);

  const summary = live?.summary;
  const { level, heading, action } = levelFor(summary);
  const style = LEVEL_STYLE[level];

  const worstZone = live?.zones.find((z) => z.zone_id === summary?.worst_zone_id);

  useEffect(() => {
    if (!summary) return;
    const escalating = (level === "critical" || level === "high") && prevLevel.current !== "critical" && prevLevel.current !== "high";
    if (escalating && !notifiedRef.current) {
      notifiedRef.current = true;
      beep();
      if ("vibrate" in navigator) navigator.vibrate([300, 120, 300, 120, 300]);
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(heading, {
            body: `${action}${summary.flood_arrival_min != null ? ` — flood arrival ${summary.flood_arrival_min} min` : ""}`,
            tag: "jalrakshak-alert",
          });
        } catch {
          /* notification unavailable */
        }
      }
    }
    if (level !== "critical" && level !== "high") notifiedRef.current = false;
    prevLevel.current = level;
  }, [level, summary, heading, action]);

  const viewRoute = async () => {
    setShowRoute(true);
    if (summary?.worst_zone_id) {
      try {
        const r = await api.routesForZone(summary.worst_zone_id);
        setRouteInfo(r);
      } catch {
        setRouteInfo(null);
      }
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col ${style.pulse ? "animate-[citizenPulse_1.6s_ease-in-out_infinite]" : ""}`}
      style={{ background: style.bg, color: style.fg }}
    >
      <style>{`@keyframes citizenPulse { 0%,100%{ filter:brightness(1);} 50%{ filter:brightness(1.18);} }`}</style>

      <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold tracking-widest opacity-80">
        <span>JALRAKSHAK AI · CITIZEN ALERT</span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400 animate-pulse"}`} />
          {connected ? "LIVE" : "CONNECTING"}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center gap-6">
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">{heading}</div>

        {summary && (
          <>
            <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
              <div>
                <div className="text-4xl font-black mono">{summary.flood_arrival_min != null ? summary.flood_arrival_min : "—"}</div>
                <div className="text-xs font-semibold tracking-wide opacity-80 mt-1">FLOOD ARRIVAL (MIN)</div>
              </div>
              <div>
                <div className="text-4xl font-black mono">{summary.safety_margin_min != null ? summary.safety_margin_min : "—"}</div>
                <div className="text-xs font-semibold tracking-wide opacity-80 mt-1">TIME TO SAFETY (MIN)</div>
              </div>
            </div>

            <div className="w-full max-w-sm rounded border border-white/25 py-3 px-4">
              <div className="text-[11px] font-semibold tracking-widest opacity-70">ACTION</div>
              <div className="text-2xl font-extrabold mt-1">{action}</div>
            </div>

            {summary.recommended_shelter && (
              <div className="w-full max-w-sm rounded border border-white/25 py-3 px-4 text-left">
                <div className="text-[11px] font-semibold tracking-widest opacity-70">SAFE SHELTER</div>
                <div className="text-lg font-bold mt-1">{summary.recommended_shelter}</div>
                {worstZone?.travel_time_min != null && (
                  <div className="text-sm opacity-80 mt-0.5">Travel time: {worstZone.travel_time_min} min</div>
                )}
              </div>
            )}

            {summary.worst_zone_id && (
              <button
                onClick={viewRoute}
                className="w-full max-w-sm rounded bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/30 py-3.5 font-bold tracking-wide text-sm"
              >
                VIEW SAFEST ROUTE
              </button>
            )}

            {showRoute && (
              <div className="w-full max-w-sm rounded border border-white/25 py-3 px-4 text-left text-sm">
                {!routeInfo?.routes && <div className="opacity-80">Loading route…</div>}
                {routeInfo?.routes?.recommended && (
                  <>
                    <div className="text-[11px] font-semibold tracking-widest opacity-70 mb-1">RECOMMENDED ROUTE</div>
                    <div className="mono text-xs opacity-90">{routeInfo.routes.recommended.nodes.join(" → ")}</div>
                    <div className="font-bold mt-1">{routeInfo.routes.recommended.travel_time_min} min</div>
                  </>
                )}
                {routeInfo && !routeInfo?.routes?.recommended && <div className="opacity-80">No active route right now.</div>}
              </div>
            )}
          </>
        )}

        {!summary && <div className="opacity-70 text-sm">Waiting for live data from the command center…</div>}
      </div>

      <div className="px-4 py-3 text-center text-[10px] opacity-60">DEMO / SIMULATED ALERT — no real emergency broadcast is sent</div>
    </div>
  );
}
