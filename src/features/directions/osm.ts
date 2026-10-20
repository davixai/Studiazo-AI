import type { LatLng, Place } from "./places";

// Servicii publice și gratuite, fără cheie, toate pe datele OpenStreetMap:
// - căutare de adrese: Photon (photon.komoot.io), făcut pentru căutare în timp ce scrii;
// - trasee: serverele OSRM ale FOSSGIS (routing.openstreetmap.de), pentru mașină, pe jos și bicicletă.
// Regula lor de folosire: trafic rezonabil și mențiunea „© OpenStreetMap” pe hartă.

export type TravelMode = "car" | "foot" | "bike";

export type RouteResult = {
  /** Metri */
  distance: number;
  /** Secunde (fără trafic: OSRM nu are date de trafic) */
  duration: number;
  /** Punctele traseului, pentru linia de pe hartă */
  path: [number, number][];
};

/** Centrul Iașiului și o cutie în jurul orașului, ca rezultatele căutării să fie de aici. */
export const IASI_CENTER: LatLng = { lat: 47.1585, lng: 27.6014 };
const IASI_BBOX = "27.45,47.08,27.75,47.25";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: { osm_id: number; osm_type: string; name?: string; street?: string; housenumber?: string; district?: string; city?: string };
};

/** Caută locuri și adrese în Iași. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, limit: "6", lat: String(IASI_CENTER.lat), lon: String(IASI_CENTER.lng), bbox: IASI_BBOX });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  if (!res.ok) throw new Error("search");
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return (data.features ?? []).map((f) => {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;
    const street = [p.street, p.housenumber].filter(Boolean).join(" ");
    const name = p.name ?? (street || "Loc fără nume");
    const detail = [p.name ? street : null, p.district, p.city].filter(Boolean).join(" · ");
    return { id: `osm-${p.osm_type}${p.osm_id}`, name, detail: detail || undefined, group: "Repere", lat, lng };
  });
}

const PROFILE: Record<TravelMode, string> = { car: "routed-car", foot: "routed-foot", bike: "routed-bike" };

/** Traseul între două puncte. Întoarce null dacă nu există drum. */
export async function fetchRoute(from: LatLng, to: LatLng, mode: TravelMode, signal?: AbortSignal): Promise<RouteResult | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const res = await fetch(`https://routing.openstreetmap.de/${PROFILE[mode]}/route/v1/driving/${coords}?overview=full&geometries=geojson`, { signal });
  if (!res.ok) throw new Error("route");
  const data = (await res.json()) as {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  const route = data.code === "Ok" ? data.routes?.[0] : undefined;
  if (!route) return null;
  return { distance: route.distance, duration: route.duration, path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]) };
}

const OSM_ENGINE: Record<TravelMode, string> = { car: "fossgis_osrm_car", foot: "fossgis_osrm_foot", bike: "fossgis_osrm_bike" };

/** Traseul deschis pe openstreetmap.org. */
export function osmDirectionsUrl(from: LatLng, to: LatLng, mode: TravelMode) {
  const pt = (p: LatLng) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  return `https://www.openstreetmap.org/directions?engine=${OSM_ENGINE[mode]}&route=${pt(from)};${pt(to)}`;
}

/** Destinația deschisă în aplicația de hărți a telefonului (Android: geo:, iPhone: Hărți). */
export function nativeMapsUrl(to: LatLng, label: string, platform: "android" | "ios") {
  const pt = `${to.lat.toFixed(6)},${to.lng.toFixed(6)}`;
  return platform === "ios"
    ? `https://maps.apple.com/?daddr=${pt}&q=${encodeURIComponent(label)}`
    : `geo:${pt}?q=${pt}(${encodeURIComponent(label)})`;
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toLocaleString("ro-RO", { maximumFractionDigits: 1 })} km`;
}
