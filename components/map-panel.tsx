"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, CircleMarker, TileLayer } from "leaflet";
import type { Complaint } from "@/lib/types";

// Approximate ward centres so complaints without GPS still land on the map.
const WARD_COORDS: Record<string, [number, number]> = {
  "Ward 8 - Anna Nagar": [13.085, 80.2101],
  "Ward 12 - T. Nagar": [13.0418, 80.2341],
  "Ward 18 - Adyar": [13.0012, 80.2565],
  "Ward 23 - Mylapore": [13.0336, 80.2687],
  "Ward 31 - Velachery": [12.9791, 80.221],
  "Ward 42 - Guindy": [13.0067, 80.2206],
  "Ward 51 - Egmore": [13.0732, 80.2609],
};
const CHENNAI: [number, number] = [13.0827, 80.2707];

type Variant = "dark" | "streets" | "satellite";
const TILES: Record<Variant, { url: string; label: string }> = {
  dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", label: "Dark" },
  streets: { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", label: "Map" },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    label: "Satellite",
  },
};

function hashJitter(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const a = ((h % 100) / 100 - 0.5) * 0.012;
  const b = (((h >> 8) % 100) / 100 - 0.5) * 0.012;
  return [a, b];
}

function coordsFor(c: Complaint): [number, number] {
  if (typeof c.lat === "number" && typeof c.lng === "number") return [c.lat, c.lng];
  const base = WARD_COORDS[c.ward] ?? CHENNAI;
  const [ja, jb] = hashJitter(c.id);
  return [base[0] + ja, base[1] + jb];
}

const PRIORITY_COLOR: Record<Complaint["priority"], string> = {
  urgent: "#fb7185",
  high: "#e08a52",
  medium: "#fbbf24",
  low: "#8a8a8a",
};

export function MapPanel({
  complaints,
  selectedId,
  onSelect,
  height = 460,
}: {
  complaints: Complaint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileRef = useRef<TileLayer | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<CircleMarker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [variant, setVariant] = useState<Variant>("dark");

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !elRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(elRef.current, { zoomControl: true, attributionControl: false }).setView(CHENNAI, 12);
      tileRef.current = L.tileLayer(TILES.dark.url, { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      renderMarkers(L);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tile layer when the user toggles basemap.
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    tileRef.current?.remove();
    tileRef.current = L.tileLayer(TILES[variant].url, { maxZoom: 19 }).addTo(map);
    tileRef.current.bringToBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  // Re-render markers when data changes.
  useEffect(() => {
    if (LRef.current) renderMarkers(LRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints, selectedId]);

  function renderMarkers(L: typeof import("leaflet")) {
    const map = mapRef.current;
    if (!map) return;
    layerRef.current.forEach((m) => m.remove());
    layerRef.current = [];
    for (const c of complaints) {
      const [lat, lng] = coordsFor(c);
      const selected = c.id === selectedId;
      const color = PRIORITY_COLOR[c.priority];
      const marker = L.circleMarker([lat, lng], {
        radius: selected ? 12 : Math.min(6 + c.impactCount * 0.4, 14),
        color: variant === "satellite" ? "#ffffff" : color,
        weight: selected ? 3 : 1.5,
        fillColor: color,
        fillOpacity: selected ? 0.95 : 0.65,
      }).addTo(map);
      marker.bindTooltip(`<b>${c.id}</b> · ${c.priority.toUpperCase()}<br/>${c.summary}`, {
        direction: "top",
        offset: [0, -6],
      });
      marker.on("click", () => onSelectRef.current?.(c.id));
      layerRef.current.push(marker);
    }
  }

  return (
    // `isolation: isolate` contains Leaflet's internal z-index:1000 controls in their
    // own stacking context so they can't paint over the ticket drawer / modals.
    <div className="relative" style={{ height, isolation: "isolate" }}>
      <div
        ref={elRef}
        style={{ height, borderRadius: 8, overflow: "hidden", background: "#0c0c0e" }}
        className="border border-border w-full"
      />
      {/* basemap switcher */}
      <div className="absolute top-3 right-3 z-[500] flex p-0.5 rounded-lg border border-border bg-surface/90 backdrop-blur shadow-lg">
        {(Object.keys(TILES) as Variant[]).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              variant === v ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {TILES[v].label}
          </button>
        ))}
      </div>
    </div>
  );
}
