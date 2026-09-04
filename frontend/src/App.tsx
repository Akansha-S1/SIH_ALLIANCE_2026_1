import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CitizenView from "./pages/CitizenView";
import CommandCenter from "./pages/CommandCenter";
import DamMonitoring from "./pages/DamMonitoring";
import DigitalTwin from "./pages/DigitalTwin";
import FloodPrediction from "./pages/FloodPrediction";
import RiskEngine from "./pages/RiskEngine";
import TimeToSafety from "./pages/TimeToSafety";
import Evacuation from "./pages/Evacuation";
import Shelters from "./pages/Shelters";
import AlertsPage from "./pages/AlertsPage";
import Analytics from "./pages/Analytics";

export default function App() {
  return (
    <Routes>
      <Route path="/citizen" element={<CitizenView />} />
      <Route element={<Layout />}>
        <Route path="/" element={<CommandCenter />} />
        <Route path="/monitoring" element={<DamMonitoring />} />
        <Route path="/twin" element={<DigitalTwin />} />
        <Route path="/flood" element={<FloodPrediction />} />
        <Route path="/risk" element={<RiskEngine />} />
        <Route path="/safety" element={<TimeToSafety />} />
        <Route path="/evacuation" element={<Evacuation />} />
        <Route path="/shelters" element={<Shelters />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}
