import { create } from "zustand";
import { WS_URL } from "../api/client";
import type { LiveState } from "../types";

interface AppState {
  live: LiveState | null;
  connected: boolean;
  selectedZoneId: string | null;
  selectedRoadId: string | null;
  selectedShelterId: string | null;
  selectDam: () => void;
  selectedEntity: "dam" | "zone" | "road" | "shelter" | "hospital" | null;
  setSelectedZone: (id: string | null) => void;
  setSelectedRoad: (id: string | null) => void;
  setSelectedShelter: (id: string | null) => void;
  connect: () => void;
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppState>((set, get) => ({
  live: null,
  connected: false,
  selectedZoneId: null,
  selectedRoadId: null,
  selectedShelterId: null,
  selectedEntity: null,
  selectDam: () => set({ selectedEntity: "dam", selectedZoneId: null, selectedRoadId: null, selectedShelterId: null }),
  setSelectedZone: (id) => set({ selectedZoneId: id, selectedEntity: id ? "zone" : null, selectedRoadId: null, selectedShelterId: null }),
  setSelectedRoad: (id) => set({ selectedRoadId: id, selectedEntity: id ? "road" : null, selectedZoneId: null, selectedShelterId: null }),
  setSelectedShelter: (id) => set({ selectedShelterId: id, selectedEntity: id ? "shelter" : null, selectedZoneId: null, selectedRoadId: null }),
  connect: () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

    const open = () => {
      socket = new WebSocket(WS_URL);
      socket.onopen = () => set({ connected: true });
      socket.onclose = () => {
        set({ connected: false });
        reconnectTimer = setTimeout(open, 1500);
      };
      socket.onerror = () => {
        socket?.close();
      };
      socket.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data) as LiveState;
          if (data.type === "state_update") {
            set({ live: data });
          }
        } catch {
          /* ignore malformed frames */
        }
      };
    };

    if (reconnectTimer) clearTimeout(reconnectTimer);
    open();
  },
}));
