import { describe, expect, it } from "vitest";
import { UNIVERSITY_RESOURCES } from "@/features/resources/data";
import { buildSteps, formatDistance, nativeMapsUrl, osmDirectionsUrl } from "./osm";
import { PLACES, filterPlaces, placeFromParam, placeToParam } from "./places";

describe("indicațiile pas cu pas", () => {
  const step = (type: string, name: string, distance: number, modifier?: string, exit?: number) => ({ name, distance, maneuver: { type, modifier, exit } });

  it("se traduc în română și comasează pașii de pe aceeași stradă", () => {
    const steps = buildSteps([
      step("depart", "Strada Berthelot", 80, "left"),
      step("turn", "Bulevardul Carol I", 250, "left"),
      step("turn", "Bulevardul Carol I", 30, "straight"),
      step("roundabout", "Strada Palas", 120, "right", 2),
      step("turn", "", 40, "right"),
      step("turn", "", 60, "left"),
      step("arrive", "", 0),
    ]);
    expect(steps.map((s) => s.text)).toEqual([
      "Pornește pe Strada Berthelot",
      "Virează la stânga pe Bulevardul Carol I",
      "La sensul giratoriu, ieși pe a 2-a ieșire pe Strada Palas",
      "Continuă pe alei și străzi mici",
      "Ai ajuns la destinație",
    ]);
    expect(steps[1].distance).toBe(280);
    expect(steps[3].distance).toBe(100);
  });
});

describe("linkul traseului", () => {
  it("păstrează locurile din listă după id și punctele după coordonate", () => {
    const info = PLACES.find((p) => p.id === "uaic-info")!;
    expect(placeToParam(info)).toBe("uaic-info");
    expect(placeFromParam("uaic-info")).toBe(info);
    const pt = placeFromParam(placeToParam({ id: "x", name: "Punct", group: "Repere", lat: 47.16012, lng: 27.58876 }));
    expect(pt).toMatchObject({ lat: 47.16012, lng: 27.58876 });
  });

  it("ignoră valori greșite sau puncte din afara Iașiului", () => {
    expect(placeFromParam("nu-exista")).toBeNull();
    expect(placeFromParam("44.43,26.10")).toBeNull();
    expect(placeFromParam("<script>")).toBeNull();
  });
});

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
