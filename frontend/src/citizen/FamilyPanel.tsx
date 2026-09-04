import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import type { ZoneState } from "../types";

const ZONE_RANK: Record<string, number> = { NORMAL: 0, MONITOR: 1, WARNING: 2, HIGH: 3, CRITICAL: 4 };

type MemberLevel = "safe" | "prepare" | "evacuate";

function levelForZone(zone: ZoneState | undefined): MemberLevel {
  if (!zone) return "safe";
  if (zone.tts_status === "CRITICAL" || zone.tts_status === "HIGH RISK") return "evacuate";
  if (zone.tts_status === "WARNING") return "prepare";
  return "safe";
}

const LEVEL_STYLE: Record<MemberLevel, { dot: string; textKey: string }> = {
  evacuate: { dot: "#ef4444", textKey: "evacuate" },
  prepare: { dot: "#eab308", textKey: "prepare" },
  safe: { dot: "#22c55e", textKey: "safe" },
};

export default function FamilyPanel({ zones, primaryZoneId }: { zones: ZoneState[]; primaryZoneId: string }) {
  const { t } = useLanguage();
  const [notified, setNotified] = useState(false);

  const primary = zones.find((z) => z.zone_id === primaryZoneId);
  const bySafety = [...zones].sort((a, b) => (ZONE_RANK[a.status] ?? 0) - (ZONE_RANK[b.status] ?? 0));
  const safest = bySafety[0];
  const middle = bySafety[Math.floor(bySafety.length / 2)] || primary;

  const members = [
    { key: "father", nameKey: "father", zone: primary },
    { key: "mother", nameKey: "mother", zone: primary },
    { key: "child", nameKey: "child", zone: middle },
    { key: "grandparent", nameKey: "grandparent", zone: safest },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded border border-white/20 p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold">👨‍👩‍👧 {t("familyAlerts")}</h3>
          <span className="text-[10px] font-bold text-green-400">✓ {t("enabled")}</span>
        </div>
        <div className="text-[10px] opacity-50 tracking-widest font-bold mb-3">{t("demoFamilyRegistry")} · Demo Family 01</div>

        <div className="space-y-2">
          {members.map((m) => {
            const level = levelForZone(m.zone);
            const style = LEVEL_STYLE[level];
            return (
              <div key={m.key} className="flex items-center justify-between text-sm py-1.5 border-b border-white/10 last:border-0">
                <span>{t(m.nameKey)}</span>
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: style.dot }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
                  {t(style.textKey)}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setNotified(true)}
          className="w-full mt-4 rounded bg-white/15 hover:bg-white/25 py-3 font-bold text-sm flex items-center justify-center gap-2"
        >
          📱 {t("notifyAllFamily")}
        </button>
        {notified && <div className="text-xs text-green-400 mt-2 text-center">✓ Sent (demo)</div>}
      </div>

      <div className="text-[10px] opacity-50 leading-relaxed rounded border border-white/10 p-3">{t("identityNote")}</div>
    </div>
  );
}
