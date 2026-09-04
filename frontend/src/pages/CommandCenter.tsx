import CesiumMap from "../map/CesiumMap";
import EntityInfoPanel from "../digitalTwin/EntityInfoPanel";
import ScenarioControl from "../components/ScenarioControl";

export default function CommandCenter() {
  return (
    <div className="relative w-full h-full min-h-[500px]">
      <CesiumMap />
      <EntityInfoPanel />
      <div className="absolute bottom-4 left-4 w-72 z-10">
        <ScenarioControl />
      </div>
      <div className="absolute top-4 left-4 z-10 text-[10px] font-semibold tracking-widest text-muted bg-panel px-2.5 py-1.5 rounded border border-panelborder">
        DEMO / SIMULATED DIGITAL TWIN — click the dam, a zone, a road or a shelter for details
      </div>
    </div>
  );
}
