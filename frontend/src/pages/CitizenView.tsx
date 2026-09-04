import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useLanguage } from "../i18n/useLanguage";
import { LANGUAGES } from "../i18n/translations";
import { api } from "../api/client";
import { useTTS } from "../citizen/useTTS";
import HotspotsPanel from "../citizen/HotspotsPanel";
import FamilyPanel from "../citizen/FamilyPanel";
import type { ZoneState } from "../types";

type Level = "critical" | "high" | "warning" | "monitor" | "normal";

const LEVEL_STYLE: Record<Level, { bg: string; fg: string; pulse: boolean }> = {
  critical: { bg: "#7f1d1d", fg: "#fef2f2", pulse: true },
  high: { bg: "#7c2d12", fg: "#fff7ed", pulse: true },
  warning: { bg: "#78350f", fg: "#fffbeb", pulse: false },
  monitor: { bg: "#713f12", fg: "#fefce8", pulse: false },
  normal: { bg: "#052e16", fg: "#f0fdf4", pulse: false },
};

function humanAreaName(name: string): string {
  return name.replace(/^Zone\s+[A-Za-z0-9]+\s*-\s*/, "");
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function levelFor(zone: ZoneState | undefined, failureRiskLevel: string | undefined) {
  const margin = zone?.safety_margin_min;
  if (margin != null) {
    if (margin < 5) return { level: "critical" as Level, headingKey: "floodAlert", actionKey: "leaveImmediately" };
    if (margin < 15) return { level: "critical" as Level, headingKey: "floodAlert", actionKey: "evacuateNow" };
    if (margin < 30) return { level: "high" as Level, headingKey: "floodWarning", actionKey: "prepareToEvacuate" };
    return { level: "warning" as Level, headingKey: "floodWatch", actionKey: "monitorSituation" };
  }
  if (failureRiskLevel === "HIGH" || failureRiskLevel === "CRITICAL") {
    return { level: "monitor" as Level, headingKey: "damMonitoring", actionKey: "stayAlert" };
  }
  return { level: "normal" as Level, headingKey: "allClear", actionKey: "noActionNeeded" };
}

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
  const { lang, setLang, t } = useLanguage();
  const speechLang = LANGUAGES.find((l) => l.code === lang)?.speechLang || "en-IN";
  const { supported: ttsSupported, speaking, speak } = useTTS();

  const [zoneId, setZoneId] = useState<string>("");
  const [editingArea, setEditingArea] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [shelters, setShelters] = useState<any[]>([]);
  const [escalationBanner, setEscalationBanner] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const prevLevel = useRef<Level | null>(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    connect();
    api.shelters().then((r) => setShelters(r.shelters)).catch(() => {});
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [connect]);

  useEffect(() => {
    if (!zoneId && live?.zones?.length) {
      const worst = live.summary?.worst_zone_id;
      setZoneId(worst && live.zones.some((z) => z.zone_id === worst) ? worst : live.zones[0].zone_id);
    }
  }, [live, zoneId]);

  const zone = live?.zones.find((z) => z.zone_id === zoneId);
  const { level, headingKey, actionKey } = levelFor(zone, live?.summary?.failure_risk_level);
  const style = LEVEL_STYLE[level];

  const shelterId = zone?.recommended_route?.[zone.recommended_route.length - 1];
  const shelter = shelters.find((s) => s.shelter_id === shelterId);
  const shelterDistanceKm = shelter && zone ? Math.round(haversineKm(zone.lat, zone.lon, shelter.lat, shelter.lon) * 10) / 10 : null;

  const speechText = (() => {
    if (!zone) return "";
    const area = humanAreaName(zone.name);
    const parts = [t(headingKey).replace(/^[^A-Za-z]+/, "")];
    if (zone.arrival_time_min != null) parts.push(`${area}. ${t("floodExpected")}: ${zone.arrival_time_min} ${t("minutes")}.`);
    parts.push(`${t(actionKey)}.`);
    if (zone.recommended_shelter) parts.push(`${t("goTo")} ${zone.recommended_shelter}.`);
    if (zone.travel_time_min != null) parts.push(`${t("travelTime")}: ${zone.travel_time_min} ${t("minutes")}.`);
    return parts.join(" ");
  })();

  const doSpeak = () => {
    const ok = speak(speechText, speechLang);
    setAudioBlocked(!ok);
    setEscalationBanner(false);
  };

  useEffect(() => {
    if (!zone) return;
    const escalating = (level === "critical" || level === "high") && prevLevel.current !== "critical" && prevLevel.current !== "high";
    if (escalating && !notifiedRef.current) {
      notifiedRef.current = true;
      setEscalationBanner(true);
      beep();
      if ("vibrate" in navigator) navigator.vibrate([300, 120, 300, 120, 300]);
      const ok = speak(speechText, speechLang);
      setAudioBlocked(!ok);
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(t(headingKey), { body: `${t(actionKey)}${zone.arrival_time_min != null ? ` — ${zone.arrival_time_min} ${t("min")}` : ""}`, tag: "jalrakshak-alert" });
        } catch {
          /* notification unavailable */
        }
      }
      const timer = setTimeout(() => setEscalationBanner(false), 15000);
      return () => clearTimeout(timer);
    }
    if (level !== "critical" && level !== "high") notifiedRef.current = false;
    prevLevel.current = level;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, zone?.zone_id]);

  const viewRoute = async () => {
    setShowRoute(true);
    if (zoneId) {
      try {
        setRouteInfo(await api.routesForZone(zoneId));
      } catch {
        setRouteInfo(null);
      }
    }
  };

  if (!live) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#052e16] text-[#f0fdf4] text-sm">
        {t("connecting")}
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col ${style.pulse ? "animate-[citizenPulse_1.6s_ease-in-out_infinite]" : ""}`} style={{ background: style.bg, color: style.fg }}>
      <style>{`@keyframes citizenPulse { 0%,100%{ filter:brightness(1);} 50%{ filter:brightness(1.18);} }`}</style>

      {escalationBanner && (
        <div className="fixed top-0 inset-x-0 z-40 bg-black text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <span className="text-sm font-bold">{t("newEmergencyAlert")}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={doSpeak} className="rounded bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold">
              {t("readAloud")}
            </button>
            <button onClick={() => setEscalationBanner(false)} className="text-xl leading-none opacity-70">
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold tracking-wide opacity-90">
        <span className="font-extrabold">{t("appName")}</span>
        <div className="flex items-center gap-3">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="bg-white/10 border border-white/25 rounded px-2 py-1 text-xs"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-[#0f1a2c] text-white">
                {l.label}
              </option>
            ))}
          </select>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400 animate-pulse"}`} />
            {connected ? t("live") : t("connecting")}
          </span>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5 max-w-sm mx-auto w-full">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t(headingKey)}</div>
        </div>

        {zone && (
          <>
            <div className="rounded border border-white/25 py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold tracking-widest opacity-70">📍 {t("yourArea")}</div>
                  <div className="text-lg font-bold mt-0.5">{humanAreaName(zone.name)}</div>
                </div>
                <button onClick={() => setEditingArea((v) => !v)} className="text-xs underline opacity-80 shrink-0">
                  {t("changeArea")}
                </button>
              </div>
              {editingArea && (
                <select
                  value={zoneId}
                  onChange={(e) => {
                    setZoneId(e.target.value);
                    setEditingArea(false);
                    setShowRoute(false);
                  }}
                  className="w-full mt-3 bg-white/10 border border-white/25 rounded px-2 py-2 text-sm"
                >
                  {live.zones.map((z) => (
                    <option key={z.zone_id} value={z.zone_id} className="bg-[#0f1a2c] text-white">
                      {humanAreaName(z.name)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="rounded border border-white/25 py-3 px-4">
              <div className="text-[11px] font-semibold tracking-widest opacity-70">💧 {t("floodExpected")}</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black mono">{zone.arrival_time_min != null ? zone.arrival_time_min : "—"}</span>
                <span className="text-sm opacity-80">{zone.arrival_time_min != null ? t("minutes") : ""}</span>
                {zone.arrival_time_min != null && (
                  <span className="ml-auto text-[10px] bg-white/15 rounded-full px-2 py-0.5 font-semibold">{t("modelEstimate")}</span>
                )}
              </div>
            </div>

            {zone.recommended_shelter && (
              <div className="rounded border border-white/25 py-3 px-4">
                <div className="text-[11px] font-semibold tracking-widest opacity-70">🏠 {t("evacuateTo")}</div>
                <div className="text-lg font-bold mt-0.5">{zone.recommended_shelter}</div>
                {shelterDistanceKm != null && <div className="text-sm opacity-80 mt-0.5">{shelterDistanceKm} km {t("away")}</div>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border border-white/25 py-3 px-4">
                <div className="text-[11px] font-semibold tracking-widest opacity-70">🚶 {t("travelTime")}</div>
                <div className="text-xl font-extrabold mt-0.5">{zone.travel_time_min != null ? `${zone.travel_time_min} ${t("min")}` : "—"}</div>
              </div>
              <div className="rounded border border-white/25 py-3 px-4">
                <div className="text-[11px] font-semibold tracking-widest opacity-70">⏱ {t("safetyBuffer")}</div>
                <div className="text-xl font-extrabold mt-0.5">{zone.safety_margin_min != null ? `${zone.safety_margin_min} ${t("min")}` : "—"}</div>
              </div>
            </div>

            <div className="rounded py-3 px-4 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.12)" }}>
              <span className="text-[11px] font-semibold tracking-widest opacity-70">{t("status")}</span>
              <span className="text-lg font-extrabold">{t(actionKey)}</span>
            </div>

            <div className="space-y-2.5">
              {zone.recommended_shelter && (
                <button onClick={viewRoute} className="w-full rounded bg-white text-black py-3.5 font-bold text-sm flex items-center justify-center gap-2">
                  🧭 {t("startSafeRoute")}
                </button>
              )}
              <button
                onClick={doSpeak}
                className="w-full rounded border-2 border-white/60 py-3 font-bold text-sm flex items-center justify-center gap-2"
              >
                {speaking ? "🔊 …" : t("readAloud")}
              </button>
              {!ttsSupported && <div className="text-xs text-center opacity-70">{t("audioNotSupported")}</div>}
              {ttsSupported && audioBlocked && <div className="text-xs text-center opacity-70">{t("audioNotSupported")}</div>}
            </div>

            {showRoute && (
              <div className="rounded border border-white/25 py-3 px-4 text-left text-sm">
                {!routeInfo?.routes && <div className="opacity-80">…</div>}
                {routeInfo?.routes?.recommended && (
                  <>
                    <div className="text-[11px] font-semibold tracking-widest opacity-70 mb-1">{t("recommendedRoute")}</div>
                    <div className="font-bold">{routeInfo.routes.recommended.travel_time_min} {t("min")}</div>
                  </>
                )}
                {routeInfo && !routeInfo?.routes?.recommended && <div className="opacity-80">{t("noRouteAvailable")}</div>}
              </div>
            )}
          </>
        )}

        {zone && (
          <>
            <hr className="border-white/15" />
            <div>
              <h2 className="font-bold mb-2">{t("communityShelters")}</h2>
              <HotspotsPanel zoneId={zone.zone_id} zoneLat={zone.lat} zoneLon={zone.lon} />
            </div>

            <hr className="border-white/15" />
            <FamilyPanel zones={live.zones} primaryZoneId={zone.zone_id} />
          </>
        )}

        <div className="text-center text-xs font-semibold opacity-80 pt-1">⚠ {t("avoidFloodedRoads")}</div>
      </div>

      <div className="px-4 py-3 text-center text-[10px] opacity-60">{t("simulatedAlert")}</div>
    </div>
  );
}
