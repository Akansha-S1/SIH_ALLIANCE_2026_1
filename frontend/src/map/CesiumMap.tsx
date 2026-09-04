import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { api } from "../api/client";
import { useStore } from "../store/useStore";
import type { DamInfo, InfrastructureItem, RoadState, ZoneStatic } from "../types";

Cesium.Ion.defaultAccessToken = "";

const STATUS_CESIUM_COLOR: Record<string, Cesium.Color> = {
  NORMAL: Cesium.Color.fromCssColorString("#22c55e"),
  SAFE: Cesium.Color.fromCssColorString("#22c55e"),
  MONITOR: Cesium.Color.fromCssColorString("#eab308"),
  WARNING: Cesium.Color.fromCssColorString("#f59e0b"),
  HIGH: Cesium.Color.fromCssColorString("#f97316"),
  CRITICAL: Cesium.Color.fromCssColorString("#ef4444"),
  OPEN: Cesium.Color.fromCssColorString("#22c55e"),
  AT_RISK: Cesium.Color.fromCssColorString("#f59e0b"),
  CLOSED: Cesium.Color.fromCssColorString("#ef4444"),
};

const INFRA_COLOR: Record<string, string> = {
  hospital: "#ef4444",
  school: "#38bdf8",
  bridge: "#a78bfa",
  power: "#facc15",
};

function colorFor(status: string): Cesium.Color {
  return STATUS_CESIUM_COLOR[status] || Cesium.Color.fromCssColorString("#7286a3");
}

export interface MapLayers {
  flood: boolean;
  roads: boolean;
  shelters: boolean;
  infrastructure: boolean;
}

export default function CesiumMap({ compact = false, layers }: { compact?: boolean; layers?: MapLayers }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const zoneEntities = useRef<Record<string, Cesium.Entity>>({});
  const floodEntities = useRef<Record<string, Cesium.Entity>>({});
  const roadEntities = useRef<Record<string, Cesium.Entity>>({});
  const shelterEntities = useRef<Record<string, Cesium.Entity>>({});
  const infraEntities = useRef<Cesium.Entity[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          credit: "© OpenStreetMap contributors",
          maximumLevel: 18,
        })
      ),
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      geocoder: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      homeButton: false,
      shouldAnimate: true,
    });
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1a10");
    (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";
    viewerRef.current = viewer;
    let cancelled = false;

    (async () => {
      const [{ zones }, { roads }, { infrastructure }, dam, { shelters }] = await Promise.all([
        api.zones() as Promise<{ zones: ZoneStatic[] }>,
        api.roads() as Promise<{ roads: RoadState[] }>,
        api.infrastructure() as Promise<{ infrastructure: InfrastructureItem[] }>,
        api.geoDam() as Promise<DamInfo>,
        api.shelters() as Promise<{ shelters: any[] }>,
      ]);
      // React StrictMode double-invokes effects in dev; if this effect's cleanup
      // already destroyed this viewer before the fetch resolved, bail out instead
      // of touching a destroyed Cesium viewer.
      if (cancelled || viewer.isDestroyed()) return;

      // dam
      const damEntity = viewer.entities.add({
        id: "entity-dam",
        position: Cesium.Cartesian3.fromDegrees(dam.lon, dam.lat, 0),
        box: {
          dimensions: new Cesium.Cartesian3(120, 540, 90),
          material: Cesium.Color.fromCssColorString("#94a3b8"),
          outline: true,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.4),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: dam.name,
          font: "600 12px Inter",
          fillColor: Cesium.Color.WHITE,
          pixelOffset: new Cesium.Cartesian2(0, -34),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      (damEntity as any)._kind = "dam";

      // reservoir (upstream ellipse)
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(dam.lon + 0.006, dam.lat + 0.01, 0),
        ellipse: {
          semiMinorAxis: 900,
          semiMajorAxis: 1500,
          material: Cesium.Color.fromCssColorString("#0ea5e9").withAlpha(0.45),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });

      // river
      const riverPositions = dam.river.path.flatMap((p) => [p[0], p[1]]);
      viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(riverPositions),
          width: 6,
          material: Cesium.Color.fromCssColorString("#0ea5e9").withAlpha(0.85),
          clampToGround: true,
        },
      });

      // roads
      for (const r of roads) {
        if (!r.coordinates || r.coordinates.length < 2) continue;
        const coords = r.coordinates.flatMap((c) => [c[0], c[1]]);
        const entity = viewer.entities.add({
          id: `road-${r.road_id}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(coords),
            width: r.is_bridge ? 6 : 4,
            material: new Cesium.PolylineDashMaterialProperty({ color: colorFor(r.status), dashLength: r.status === "CLOSED" ? 8 : 0 }),
            clampToGround: true,
          },
        });
        (entity as any)._kind = "road";
        (entity as any)._id = r.road_id;
        roadEntities.current[r.road_id] = entity;
      }

      // zones
      for (const z of zones) {
        const entity = viewer.entities.add({
          id: `zone-${z.zone_id}`,
          position: Cesium.Cartesian3.fromDegrees(z.lon, z.lat, 0),
          point: {
            pixelSize: Math.max(14, Math.min(30, Math.sqrt(z.population) / 6)),
            color: colorFor("NORMAL"),
            outlineColor: Cesium.Color.BLACK.withAlpha(0.5),
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: z.name,
            font: "600 11px Inter",
            fillColor: Cesium.Color.WHITE,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        (entity as any)._kind = "zone";
        (entity as any)._id = z.zone_id;
        zoneEntities.current[z.zone_id] = entity;

        const flood = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(z.lon, z.lat, 0),
          ellipse: {
            semiMinorAxis: 10,
            semiMajorAxis: 10,
            material: Cesium.Color.fromCssColorString("#3b82f6").withAlpha(0),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
        floodEntities.current[z.zone_id] = flood;
      }

      // shelters
      for (const s of shelters) {
        const entity = viewer.entities.add({
          id: `shelter-${s.shelter_id}`,
          position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 0),
          point: {
            pixelSize: 16,
            color: Cesium.Color.fromCssColorString("#22c55e"),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `⌂ ${s.name}`,
            font: "600 10px Inter",
            fillColor: Cesium.Color.fromCssColorString("#22c55e"),
            pixelOffset: new Cesium.Cartesian2(0, -18),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        (entity as any)._kind = "shelter";
        (entity as any)._id = s.shelter_id;
        shelterEntities.current[s.shelter_id] = entity;
      }

      // infrastructure markers
      for (const item of infrastructure) {
        const infraEntity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(item.lon, item.lat, 0),
          point: {
            pixelSize: 10,
            color: Cesium.Color.fromCssColorString(INFRA_COLOR[item.type] || "#94a3b8"),
            outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
            outlineWidth: 1.5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: item.type.toUpperCase(),
            font: "500 9px Inter",
            fillColor: Cesium.Color.fromCssColorString(INFRA_COLOR[item.type] || "#94a3b8"),
            pixelOffset: new Cesium.Cartesian2(0, -14),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        infraEntities.current.push(infraEntity);
      }

      // Frame the camera to whatever entities actually exist (dam, zones, shelters,
      // roads, infrastructure) rather than a hand-picked destination -- robust to
      // the exact demo geography without needing to eyeball coordinates.
      viewer.zoomTo(viewer.entities, new Cesium.HeadingPitchRange(Cesium.Math.toRadians(15), Cesium.Math.toRadians(-42), 24000));

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = viewer.scene.pick(movement.position);
        if (!Cesium.defined(picked) || !picked.id) return;
        const ent = picked.id as any;
        const store = useStore.getState();
        if (ent._kind === "dam") store.selectDam();
        else if (ent._kind === "zone") store.setSelectedZone(ent._id);
        else if (ent._kind === "road") store.setSelectedRoad(ent._id);
        else if (ent._kind === "shelter") store.setSelectedShelter(ent._id);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    })();

    return () => {
      cancelled = true;
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live updates: colors, flood ellipses, road status
  const live = useStore((s) => s.live);
  useEffect(() => {
    if (!live) return;
    for (const z of live.zones) {
      const point = zoneEntities.current[z.zone_id];
      if (point?.point) point.point.color = new Cesium.ConstantProperty(colorFor(z.status));

      const flood = floodEntities.current[z.zone_id];
      if (flood?.ellipse) {
        const radius = 250 + z.flood_depth_m * 380;
        flood.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radius);
        flood.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radius * 1.25);
        const alpha = z.flood_depth_m > 0 ? 0.5 : 0;
        flood.ellipse.material = new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString("#3b82f6").withAlpha(alpha));
        flood.ellipse.extrudedHeight = new Cesium.ConstantProperty(z.flood_depth_m * 25);
      }
    }
    for (const r of live.roads) {
      const road = roadEntities.current[r.road_id];
      if (road?.polyline) {
        road.polyline.material = new Cesium.PolylineDashMaterialProperty({
          color: colorFor(r.status),
          dashLength: r.status === "CLOSED" ? 8 : 0,
        }) as any;
      }
    }
    for (const s of live.shelters) {
      const shelter = shelterEntities.current[s.shelter_id];
      if (shelter?.point) {
        const color = s.available <= 0 ? "#ef4444" : s.flood_risk !== "LOW" ? "#eab308" : "#22c55e";
        shelter.point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString(color));
      }
    }
  }, [live]);

  useEffect(() => {
    if (!layers) return;
    Object.values(floodEntities.current).forEach((e) => (e.show = layers.flood));
    Object.values(roadEntities.current).forEach((e) => (e.show = layers.roads));
    Object.values(shelterEntities.current).forEach((e) => (e.show = layers.shelters));
    infraEntities.current.forEach((e) => (e.show = layers.infrastructure));
  }, [layers]);

  return <div ref={containerRef} className={compact ? "w-full h-full rounded-md overflow-hidden" : "w-full h-full"} />;
}
