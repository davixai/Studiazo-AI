import { describe, expect, it } from "vitest";
import { chartPoints, smoothArea, smoothLine, weekTrend, weeklyCounts } from "./chart-math";

describe("weeklyCounts", () => {
  // Sâmbătă, 17.10.2026, ora României; săptămâna curentă începe luni, 12.10.
  const now = new Date("2026-10-17T12:00:00+03:00");

  it("8 săptămâni, de la cea mai veche la cea curentă, cu începutul în zi de luni", () => {
    const b = weeklyCounts([], now);
    expect(b).toHaveLength(8);
    expect(b[7].weekKey).toBe("2026-10-12");
    expect(b[0].weekKey).toBe("2026-08-24");
    expect(b.every((x) => x.count === 0)).toBe(true);
  });

  it("numără pe săptămâni locale: duminică seara la 23:30 (ora României) e încă săptămâna trecută", () => {
    const b = weeklyCounts(
      [
        "2026-10-12T00:10:00+03:00", // luni devreme → săptămâna curentă
        "2026-10-11T23:30:00+03:00", // duminică seara → săptămâna trecută (în UTC ar fi tot duminică)
        "2026-10-11T21:30:00Z", // = luni 00:30 ora României → săptămâna curentă
        "2026-01-01T10:00:00Z", // prea veche
        "2026-10-20T10:00:00Z", // în viitor
      ],
      now,
    );
    expect(b[7].count).toBe(2);
    expect(b[6].count).toBe(1);
    expect(b.reduce((s, x) => s + x.count, 0)).toBe(3);
  });

  it("trece corect peste schimbarea orei (25.10.2026)", () => {
    const after = new Date("2026-10-28T12:00:00+02:00");
    const b = weeklyCounts(["2026-10-25T23:00:00+02:00", "2026-10-26T00:30:00+02:00"], after);
    expect(b[7].weekKey).toBe("2026-10-26");
    expect(b[7].count).toBe(1);
    expect(b[6].count).toBe(1);
  });
});

describe("weekTrend", () => {
  it("săptămâna curentă minus cea trecută", () => {
    expect(weekTrend([{ weekKey: "a", count: 2 }, { weekKey: "b", count: 5 }])).toBe(3);
    expect(weekTrend([{ weekKey: "a", count: 4 }, { weekKey: "b", count: 1 }])).toBe(-3);
    expect(weekTrend([{ weekKey: "a", count: 4 }])).toBe(0);
  });
});

describe("chartPoints / smoothLine", () => {
  it("maximul atinge partea de sus (minus spațiu), zero stă jos, x egal distanțat", () => {
    const pts = chartPoints([0, 5, 10], 200, 100, 10);
    expect(pts).toEqual([
      { x: 0, y: 100 },
      { x: 100, y: 55 },
      { x: 200, y: 10 },
    ]);
  });

  it("toate valorile zero → linie dreaptă jos; un singur punct → la mijloc", () => {
    expect(chartPoints([0, 0], 100, 50).every((p) => p.y === 50)).toBe(true);
    expect(chartPoints([3], 100, 50)).toEqual([{ x: 50, y: 6 }]);
    expect(chartPoints([], 100, 50)).toEqual([]);
  });

  it("o serie plată urmată de o creștere nu coboară sub linia de zero (fără „scufundare”)", () => {
    const pts = chartPoints([0, 0, 0, 9], 300, 97);
    const ys = smoothLine(pts, 100)
      .split(/[ MCL]/)
      .filter((part) => part.includes(","))
      .map((part) => Number(part.split(",")[1]));
    expect(Math.max(...ys)).toBeLessThanOrEqual(97); // 97 = linia de zero
  });

  it("curba nu iese din grafic (punctele de control sunt limitate)", () => {
    const pts = chartPoints([0, 10, 0, 10], 300, 100);
    const ys = smoothLine(pts, 100)
      .split(/[ MCL]/)
      .filter((s) => s.includes(","))
      .map((s) => Number(s.split(",")[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(100);
  });

  it("zona se închide pe axa de jos", () => {
    const area = smoothArea(chartPoints([1, 2], 100, 50), 50);
    expect(area.endsWith("L100,50 L0,50 Z")).toBe(true);
  });
});
