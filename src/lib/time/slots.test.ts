import { describe, expect, it } from "vitest";
import { computeFreeSlots, findConflicts, findInternalOverlaps, mergeIntervals, overlaps } from "./slots";
import { dayBounds, fromLocal, toTimeOfDay } from "./zone";

const at = (date: string, time: string) => fromLocal(date, time);
const iv = (date: string, from: string, to: string) => ({ start: at(date, from), end: at(date, to) });

describe("suprapuneri", () => {
  it("intervalele lipite nu se suprapun", () => {
    expect(overlaps(iv("2026-10-20", "08:00", "10:00"), iv("2026-10-20", "10:00", "12:00"))).toBe(false);
    expect(overlaps(iv("2026-10-20", "08:00", "10:01"), iv("2026-10-20", "10:00", "12:00"))).toBe(true);
  });

  it("găsește conflictele cu programul existent", () => {
    const busy = [
      { ...iv("2026-10-20", "08:00", "10:00"), title: "Curs" },
      { ...iv("2026-10-20", "12:00", "14:00"), title: "Laborator" },
    ];
    expect(findConflicts(iv("2026-10-20", "09:30", "11:00"), busy).map((b) => b.title)).toEqual(["Curs"]);
    expect(findConflicts(iv("2026-10-20", "10:00", "12:00"), busy)).toHaveLength(0);
  });

  it("găsește suprapunerile din interiorul unei propuneri", () => {
    const items = [iv("2026-10-21", "18:00", "19:00"), iv("2026-10-21", "18:30", "19:30"), iv("2026-10-21", "20:00", "21:00")];
    expect(findInternalOverlaps(items)).toHaveLength(1);
  });

  it("unește intervalele care se ating", () => {
    expect(mergeIntervals([iv("2026-10-20", "08:00", "10:00"), iv("2026-10-20", "10:00", "11:00")])).toHaveLength(1);
  });
});

describe("intervale libere", () => {
  it("scade activitățile ocupate (cu pauză) din disponibilitate", () => {
    const slots = computeFreeSlots({
      range: dayBounds("2026-10-20"),
      busy: [iv("2026-10-20", "10:00", "12:00"), iv("2026-10-20", "14:00", "16:00")],
      availability: [{ weekday: 2, start: "09:00", end: "18:00" }],
      minMinutes: 30,
      bufferMinutes: 10,
    });
    expect(slots.map((s) => `${toTimeOfDay(s.start)}-${toTimeOfDay(s.end)}`)).toEqual(["09:00-09:50", "12:10-13:50", "16:10-18:00"]);
  });

  it("ignoră intervalele mai scurte decât minimul și trecutul", () => {
    const slots = computeFreeSlots({
      range: dayBounds("2026-10-20"),
      busy: [iv("2026-10-20", "09:20", "17:00")],
      availability: [{ weekday: 2, start: "09:00", end: "18:00" }],
      minMinutes: 45,
      bufferMinutes: 0,
      notBefore: at("2026-10-20", "17:30"),
    });
    expect(slots.map((s) => `${toTimeOfDay(s.start)}-${toTimeOfDay(s.end)}`)).toEqual([]);
  });

  it("folosește 08:00–22:00 când studentul nu și-a setat disponibilitatea", () => {
    const slots = computeFreeSlots({ range: dayBounds("2026-10-24"), busy: [], bufferMinutes: 0 });
    expect(slots.map((s) => `${toTimeOfDay(s.start)}-${toTimeOfDay(s.end)}`)).toEqual(["08:00-22:00"]);
  });

  it("calculează corect în ziua schimbării orei", () => {
    const slots = computeFreeSlots({
      range: dayBounds("2026-10-25"),
      busy: [],
      availability: [{ weekday: 7, start: "08:00", end: "10:00" }],
      bufferMinutes: 0,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].start.toISOString()).toBe("2026-10-25T06:00:00.000Z"); // deja ora de iarnă (UTC+2)
    expect((slots[0].end.getTime() - slots[0].start.getTime()) / 60_000).toBe(120);
  });
});
