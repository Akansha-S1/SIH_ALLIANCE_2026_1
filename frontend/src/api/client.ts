// Default to whatever host the page itself was loaded from (LAN IP or localhost)
// so a phone hitting http://<lan-ip>:5173 automatically talks to http://<lan-ip>:8000
// instead of a hardcoded "localhost" that would resolve to the phone itself.
const inferredHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const BACKEND_PORT = (import.meta as any).env?.VITE_BACKEND_PORT || "8000";

export const API_BASE = (import.meta as any).env?.VITE_API_BASE || `http://${inferredHost}:${BACKEND_PORT}`;
export const WS_URL = (import.meta as any).env?.VITE_WS_URL || API_BASE.replace(/^http/, "ws") + "/ws/live";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  damStatus: () => get<any>("/api/dam/status"),
  zones: () => get<{ zones: any[] }>("/api/zones"),
  roads: () => get<{ roads: any[] }>("/api/roads"),
  shelters: () => get<{ shelters: any[] }>("/api/shelters"),
  infrastructure: () => get<{ infrastructure: any[] }>("/api/infrastructure"),
  geoDam: () => get<any>("/api/geo/dam"),
  analyticsHistory: () => get<{ series: Record<string, { t: number; v: number }[]>; metrics: string[] }>("/api/analytics/history"),
  routesForZone: (zoneId: string) => get<any>(`/api/routes?zone_id=${zoneId}`),
  simulationState: () => get<any>("/api/simulation/state"),
  scenarios: () => get<{ scenarios: string[]; current: string }>("/api/simulation/scenarios"),

  start: () => post("/api/simulation/start"),
  pause: () => post("/api/simulation/pause"),
  reset: () => post("/api/simulation/reset"),
  setScenario: (scenario: string) => post("/api/simulation/scenario", { scenario }),
  setSpeed: (speed: number) => post("/api/simulation/speed", { speed }),
};
