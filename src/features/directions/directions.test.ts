import { describe, expect, it } from "vitest";
import { UNIVERSITY_RESOURCES } from "@/features/resources/data";
import { formatDistance, nativeMapsUrl, osmDirectionsUrl } from "./osm";
import { PLACES, filterPlaces } from "./places";

describe("locurile din Trasee", () => {
  it("au id-uri unice și coordonate în Iași", () => {
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    for (const p of PLACES) {
      expect(p.lat).toBeGreaterThan(47.08);
      expect(p.lat).toBeLessThan(47.25);
      expect(p.lng).toBeGreaterThan(27.45);
      expect(p.lng).toBeLessThan(27.75);
    }
  });

  it("cuprind toate facultățile din Resurse", () => {
    const names = new Set(PLACES.map((p) => p.name));
    for (const u of UNIVERSITY_RESOURCES) for (const f of u.faculties) expect(names, f.name).toContain(f.name);
  });

  it("se filtrează fără diacritice", () => {
    expect(filterPlaces("informatica").map((p) => p.id)).toContain("uaic-info");
    expect(filterPlaces("biblioteca eminescu").map((p) => p.id)).toEqual(["bcu"]);
  });
});

describe("linkuri și formatare", () => {
  const a = { lat: 47.174251, lng: 27.571137 };
  const b = { lat: 47.153886, lng: 27.593992 };

  it("construiește linkurile de navigare", () => {
    expect(osmDirectionsUrl(a, b, "foot")).toBe(
      "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=47.174251,27.571137;47.153886,27.593992",
    );
    expect(nativeMapsUrl(b, "AC", "android")).toBe("geo:47.153886,27.593992?q=47.153886,27.593992(AC)");
    expect(nativeMapsUrl(b, "AC", "ios")).toContain("maps.apple.com/?daddr=47.153886,27.593992");
  });

  it("formatează distanța", () => {
    expect(formatDistance(234)).toBe("230 m");
    expect(formatDistance(3456)).toBe("3,5 km");
  });
});
