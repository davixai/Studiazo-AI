"use client";

import "leaflet/dist/leaflet.css";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { IASI_CENTER } from "../osm";
import type { LatLng } from "../places";

// Harta OpenStreetMap (Leaflet). Leaflet folosește `window`, deci se încarcă doar în browser.
// Pe tema întunecată, plăcile hărții sunt inversate din CSS (`.route-map` în globals.css).

type Props = {
  from: LatLng | null;
  to: LatLng | null;
  path: [number, number][] | null;
  className?: string;
};

const pin = (label: string, kind: "from" | "to") => `<span class="route-pin route-pin--${kind}">${label}</span>`;

type Data = Pick<Props, "from" | "to" | "path">;
type Ready = { L: typeof import("leaflet"); map: LeafletMap; group: LayerGroup };

export function RouteMap({ from, to, path, className }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const ready = useRef<Ready | null>(null);
  // Ultimele date, ca să fie desenate și dacă sosesc înainte să se termine încărcarea hărții.
  const latest = useRef<Data>({ from: null, to: null, path: null });

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      const map = L.map(el.current, { zoomControl: false }).setView([IASI_CENTER.lat, IASI_CENTER.lng], 13);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).addTo(map);
      map.attributionControl.setPrefix(false);
      ready.current = { L, map, group: L.layerGroup().addTo(map) };
      draw(ready.current, latest.current);
    });
    return () => {
      cancelled = true;
      ready.current?.map.remove();
      ready.current = null;
    };
  }, []);

  useEffect(() => {
    latest.current = { from, to, path };
    if (ready.current) draw(ready.current, latest.current);
  }, [from, to, path]);

  return <div ref={el} className={cn("route-map isolate z-0 h-full w-full", className)} role="region" aria-label="Harta traseului" />;
}

function draw({ L, map: m, group }: Ready, { from, to, path }: Data) {
  group.clearLayers();

  if (path && path.length > 1) {
    // Culoarea de accent a temei curente; un contur lat și estompat sub linie, ca traseul să iasă din hartă.
    const color = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
    L.polyline(path, { color, weight: 11, opacity: 0.25, lineCap: "round" }).addTo(group);
    L.polyline(path, { color, weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round" }).addTo(group);
  }
  const icon = (label: string, kind: "from" | "to") =>
    L.divIcon({ html: pin(label, kind), className: "", iconSize: [32, 32], iconAnchor: [16, 16] });
  if (from) L.marker([from.lat, from.lng], { icon: icon("A", "from"), keyboard: false }).addTo(group);
  if (to) L.marker([to.lat, to.lng], { icon: icon("B", "to"), keyboard: false }).addTo(group);

  const points: [number, number][] = path && path.length > 1 ? path : [from, to].filter((p): p is LatLng => !!p).map((p) => [p.lat, p.lng]);
  if (points.length > 1) m.flyToBounds(L.latLngBounds(points), { padding: [48, 48], duration: 0.8, maxZoom: 17 });
  else if (points.length === 1) m.flyTo(points[0], 16, { duration: 0.8 });
}
