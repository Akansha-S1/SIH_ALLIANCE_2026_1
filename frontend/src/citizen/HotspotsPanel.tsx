import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import { api } from "../api/client";
import ReportSpaceForm from "./ReportSpaceForm";

const MY_SPACE_KEY = "jalrakshak-my-hotspot";

const SAFETY_BADGE: Record<string, { key: string; color: string }> = {
  SAFE: { key: "badgeSafe", color: "#22c55e" },
  VERIFY: { key: "badgeVerify", color: "#eab308" },
  UNSAFE: { key: "badgeUnsafe", color: "#ef4444" },
};

function readMySpace(): { id: string; token: string } | null {
  try {
    const raw = localStorage.getItem(MY_SPACE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function HotspotsPanel({ zoneId, zoneLat, zoneLon }: { zoneId: string; zoneLat: number; zoneLon: number }) {
  const { t } = useLanguage();
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mySpace, setMySpace] = useState(readMySpace());
  const [myHotspot, setMyHotspot] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api
        .hotspotsNear(zoneId)
        .then((r) => !cancelled && setHotspots(r.hotspots))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [zoneId]);

  useEffect(() => {
    if (!mySpace) return;
    let cancelled = false;
    const load = () => {
      api
        .getHotspot(mySpace.id)
        .then((r) => !cancelled && setMyHotspot(r.hotspot))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [mySpace]);

  const onCreated = (id: string, token: string) => {
    const rec = { id, token };
    try {
      localStorage.setItem(MY_SPACE_KEY, JSON.stringify(rec));
    } catch {
      /* ignore */
    }
    setMySpace(rec);
    setShowForm(false);
    setToast(t("thankYouReport"));
    setTimeout(() => setToast(null), 4000);
  };

  const updateMySpace = async (patch: { capacity?: number; occupancy?: number; status?: string }) => {
    if (!mySpace) return;
    const { hotspot } = await api.updateHotspot(mySpace.id, { owner_token: mySpace.token, ...patch });
    setMyHotspot(hotspot);
  };

  return (
    <div className="space-y-4">
      {toast && <div className="rounded border border-green-500/40 bg-green-500/10 text-green-300 text-xs p-3">{toast}</div>}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold tracking-widest opacity-70">{t("nearbySafeSpaces")}</h3>
        </div>
        {hotspots.length === 0 && <div className="text-xs opacity-60 rounded border border-white/15 p-3">{t("noHotspotsNearby")}</div>}
        <div className="space-y-2">
          {hotspots.map((h) => {
            const badge = SAFETY_BADGE[h.safety] || SAFETY_BADGE.VERIFY;
            return (
              <div key={h.id} className="rounded border border-white/15 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold">🏠 {t(`spaceType_${h.type}`)}</span>
                  <span className="text-[10px] font-bold" style={{ color: badge.color }}>
                    {t(badge.key)}
                  </span>
                </div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  {h.verified ? t("authorityVerified") : `${t("communityReported")} · ${t("unverified")}`}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {t("available")}: {h.available} · {h.travel_time_min != null ? `${h.travel_time_min} ${t("min")} ${t("away")}` : ""}
                </div>
                {h.notes && <div className="text-xs opacity-60 mt-1 italic">"{h.notes}"</div>}
              </div>
            );
          })}
        </div>
      </div>

      {mySpace && myHotspot && (
        <div className="rounded border border-white/25 p-3 text-sm">
          <div className="text-xs font-bold tracking-widest opacity-70 mb-2">{t("mySafeSpace")}</div>
          <div className="flex items-center justify-between mb-1">
            <span className="opacity-70">{t("status")}</span>
            <span className="font-bold">{myHotspot.status === "OPEN" ? `🟢 ${t("open")}` : `⚪ ${t("closed")}`}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="opacity-70">{t("capacity")}</span>
            <span>{myHotspot.capacity}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="opacity-70">{t("available")}</span>
            <span className="font-bold">{myHotspot.available}</span>
          </div>
          {myHotspot.status === "OPEN" && (
            <div className="flex gap-2">
              <button
                onClick={() => updateMySpace({ capacity: myHotspot.capacity + 5 })}
                className="flex-1 rounded border border-white/25 py-2 text-xs font-bold"
              >
                {t("updateCapacity")}
              </button>
              <button onClick={() => updateMySpace({ status: "CLOSED" })} className="flex-1 rounded border border-red-500/40 text-red-300 py-2 text-xs font-bold">
                {t("closeSpace")}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded border border-white/20 p-4 text-center">
        <div className="font-bold mb-1">{t("canYouProvideShelter")}</div>
        <div className="text-xs opacity-70 mb-3">{t("haveASafeSpace")}</div>
        <button onClick={() => setShowForm(true)} className="w-full rounded bg-white/15 hover:bg-white/25 py-3 font-bold text-sm">
          {t("reportSafeSpaceBtn")}
        </button>
      </div>

      {showForm && <ReportSpaceForm fallbackLat={zoneLat} fallbackLon={zoneLon} onClose={() => setShowForm(false)} onCreated={onCreated} />}
    </div>
  );
}
