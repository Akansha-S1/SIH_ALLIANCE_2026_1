import { useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import { api } from "../api/client";

const TYPES = ["home", "community_hall", "school", "religious_building", "apartment", "public_building", "other"];

export default function ReportSpaceForm({
  fallbackLat,
  fallbackLon,
  onClose,
  onCreated,
}: {
  fallbackLat: number;
  fallbackLon: number;
  onClose: () => void;
  onCreated: (hotspotId: string, ownerToken: string) => void;
}) {
  const { t } = useLanguage();
  const [type, setType] = useState("home");
  const [capacity, setCapacity] = useState("10");
  const [available, setAvailable] = useState(true);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "ok" | "unavailable">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      return;
    }
    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationStatus("ok");
      },
      () => setLocationStatus("unavailable"),
      { timeout: 8000 }
    );
  };

  const submit = async () => {
    if (!confirmed) return;
    setSubmitting(true);
    setError(null);
    const useCoords = coords || { lat: fallbackLat, lon: fallbackLon };
    try {
      const { hotspot, owner_token } = await api.createHotspot({
        type,
        lat: useCoords.lat,
        lon: useCoords.lon,
        capacity: Math.max(1, parseInt(capacity, 10) || 1),
        notes: available ? notes : `${notes} (currently not accepting more people)`.trim(),
      });
      onCreated(hotspot.id, owner_token);
    } catch {
      setError("Could not submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0f1a2c] text-[#c9d6e8] w-full sm:max-w-md sm:rounded-md max-h-[92vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold">{t("reportSafeSpace")}</h2>
          <button onClick={onClose} className="text-2xl leading-none opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold opacity-70 mb-1.5">{t("location")}</label>
            <button
              onClick={useMyLocation}
              className="w-full rounded border border-white/25 py-2.5 font-semibold text-sm bg-white/5 hover:bg-white/10"
            >
              📍 {t("useMyLocation")}
            </button>
            {locationStatus === "locating" && <div className="text-xs opacity-60 mt-1">Locating…</div>}
            {locationStatus === "ok" && <div className="text-xs text-green-400 mt-1">✓ Location captured</div>}
            {locationStatus === "unavailable" && <div className="text-xs opacity-60 mt-1">{t("locationUnavailable")}</div>}
          </div>

          <div>
            <label className="block text-xs font-semibold opacity-70 mb-1.5">{t("typeOfSpace")}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded border border-white/25 bg-transparent py-2.5 px-3 text-sm">
              {TYPES.map((ty) => (
                <option key={ty} value={ty} className="bg-[#0f1a2c]">
                  {t(`spaceType_${ty}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold opacity-70 mb-1.5">{t("estimatedCapacity")}</label>
            <input
              type="number"
              min={1}
              max={5000}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full rounded border border-white/25 bg-transparent py-2.5 px-3 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="w-4 h-4" />
            {t("spaceAvailableForMore")}
          </label>

          <div>
            <label className="block text-xs font-semibold opacity-70 mb-1.5">{t("optionalContact")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded border border-white/25 bg-transparent py-2 px-3 text-sm"
            />
          </div>

          <label className="flex items-start gap-2 text-xs leading-snug">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-4 h-4 mt-0.5 shrink-0" />
            {t("safetyConfirm")}
          </label>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <button
            onClick={submit}
            disabled={!confirmed || submitting}
            className="w-full rounded bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 font-bold text-sm"
          >
            {submitting ? "…" : t("submitReport")}
          </button>
          <button onClick={onClose} className="w-full rounded border border-white/20 py-2.5 text-sm opacity-80">
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
