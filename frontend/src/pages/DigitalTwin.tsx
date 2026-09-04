import { useState } from "react";
import CesiumMap, { type MapLayers } from "../map/CesiumMap";
import EntityInfoPanel from "../digitalTwin/EntityInfoPanel";

const LAYER_LABELS: Record<keyof MapLayers, string> = {
  flood: "Flood Extent / Depth",
  roads: "Roads & Evacuation Routes",
  shelters: "Shelters",
  infrastructure: "Hospitals / Schools / Bridges",
};

export default function DigitalTwin() {
  const [layers, setLayers] = useState<MapLayers>({ flood: true, roads: true, shelters: true, infrastructure: true });

  const toggle = (key: keyof MapLayers) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <CesiumMap layers={layers} />
      <EntityInfoPanel />

      <div className="absolute top-4 left-4 z-10 w-56 rounded-sm border border-panelborder bg-panel p-3">
        <div className="text-[10px] font-bold tracking-widest text-muted mb-2">MAP LAYERS</div>
        <div className="space-y-1.5">
          {(Object.keys(LAYER_LABELS) as (keyof MapLayers)[]).map((key) => (
            <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={layers[key]} onChange={() => toggle(key)} className="accent-cyan-400" />
              {LAYER_LABELS[key]}
            </label>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-panelborder text-[10px] text-muted leading-relaxed">
          Terrain uses flat-ellipsoid + OpenStreetMap imagery (no Cesium Ion token
          required for this demo). Flood extents are a simplified propagation model,
          not a validated hydrodynamic simulation.
        </div>
      </div>
    </div>
  );
}
