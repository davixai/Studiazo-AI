import { describe, expect, it } from "vitest";
import { dayBounds, fromLocal, isoWeekday, shiftDateKey, startOfWeekKey, toDateKey, toTimeOfDay } from "./zone";

describe("fus orar Europe/Bucharest", () => {
  it("convertește ora locală de vară (UTC+3)", () => {
    expect(fromLocal("2026-10-20", "08:00").toISOString()).toBe("2026-10-20T05:00:00.000Z");
  });

  it("convertește ora locală de iarnă (UTC+2) după 25 octombrie 2026", () => {
    expect(fromLocal("2026-10-27", "08:00").toISOString()).toBe("2026-10-27T06:00:00.000Z");
  });

  it("ziua schimbării orei toamna are 25 de ore", () => {
    const { start, end } = dayBounds("2026-10-25");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25);
  });

  it("ziua schimbării orei primăvara are 23 de ore", () => {
    const { start, end } = dayBounds("2027-03-28");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });

  it("data locală diferă de data UTC aproape de miezul nopții", () => {
    const instant = new Date("2026-10-17T22:30:00.000Z"); // 01:30 pe 18 oct. în București
    expect(toDateKey(instant)).toBe("2026-10-18");
    expect(toTimeOfDay(instant)).toBe("01:30");
  });

  it("calculează ziua săptămânii și începutul săptămânii (luni)", () => {
    expect(isoWeekday("2026-10-17")).toBe(6); // sâmbătă
    expect(isoWeekday("2026-10-18")).toBe(7); // duminică
    expect(startOfWeekKey("2026-10-18")).toBe("2026-10-12");
    expect(shiftDateKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});
