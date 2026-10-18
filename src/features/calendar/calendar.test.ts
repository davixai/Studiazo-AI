import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/lib/contracts/domain";
import { expandEvent, expandEvents } from "@/lib/time/recurrence";
import { fromLocal } from "@/lib/time/zone";
import { conflictRange, firstConflicts } from "./conflicts";
import { hourRange, layoutLanes } from "./layout";
import { EventFormSchema, TaskFormSchema, safeReturn } from "./schemas";

const form = (overrides: Record<string, string> = {}) => ({
  kind: "curs",
  title: "Analiză matematică",
  subjectId: "",
  location: "",
  notes: "",
  date: "2026-10-19",
  startTime: "10:00",
  endTime: "12:00",
  recurrence: "weekly",
  recurrenceUntil: "",
  ...overrides,
});

function event(id: string, date: string, start: string, end: string, partial: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id,
    subjectId: null,
    kind: "curs",
    title: id,
    location: null,
    notes: null,
    startsAt: fromLocal(date, start).toISOString(),
    endsAt: fromLocal(date, end).toISOString(),
    timezone: "Europe/Bucharest",
    recurrence: "none",
    recurrenceUntil: null,
    excludedDates: [],
    completedAt: null,
    proposalId: null,
    ...partial,
  };
}

describe("EventFormSchema", () => {
  it("acceptă o activitate validă și golește câmpurile opționale", () => {
    const result = EventFormSchema.parse(form({ location: "  " }));
    expect(result).toMatchObject({ kind: "curs", subjectId: null, location: null, recurrenceUntil: null, allowOverlap: false });
  });

  it("acceptă orice interval; sfârșitul înaintea începutului înseamnă a doua zi", () => {
    for (const [startTime, endTime] of [["10:00", "12:00"], ["00:00", "23:55"], ["12:00", "10:00"], ["22:00", "02:00"], ["10:00", "00:00"]]) {
      expect(EventFormSchema.safeParse(form({ startTime, endTime })).success).toBe(true);
    }
  });

  it("respinge doar aceeași oră la început și la sfârșit", () => {
    const result = EventFormSchema.safeParse(form({ startTime: "10:00", endTime: "10:00" }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endTime"]);
  });

  it("cere un titlu și un tip valid", () => {
    expect(EventFormSchema.safeParse(form({ title: "   " })).success).toBe(false);
    expect(EventFormSchema.safeParse(form({ kind: "petrecere" })).success).toBe(false);
  });

  it("respinge finalul recurenței înaintea primei apariții", () => {
    expect(EventFormSchema.safeParse(form({ recurrenceUntil: "2026-10-01" })).success).toBe(false);
  });

  it("ignoră finalul recurenței pentru o activitate unică", () => {
    expect(EventFormSchema.parse(form({ recurrence: "none", recurrenceUntil: "2026-12-20" })).recurrenceUntil).toBeNull();
  });

  it("nu acceptă un id de materie inventat", () => {
    expect(EventFormSchema.safeParse(form({ subjectId: "matematica" })).success).toBe(false);
  });

  it("citește „Salvează oricum” doar din valoarea 1", () => {
    expect(EventFormSchema.parse(form({ allowOverlap: "1" })).allowOverlap).toBe(true);
    expect(EventFormSchema.parse(form({ allowOverlap: "da" })).allowOverlap).toBe(false);
  });
});

describe("suprapuneri", () => {
  it("găsește activitatea care se suprapune, o singură dată pe activitate", () => {
    const candidate = event("nou", "2026-10-19", "11:00", "13:00", { recurrence: "weekly" });
    const weekly = event("seminar", "2026-10-19", "12:00", "14:00", { recurrence: "weekly" });
    const range = conflictRange(candidate);
    const conflicts = firstConflicts(expandEvent(candidate, range), expandEvents([weekly], range));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].occurrenceDate).toBe("2026-10-19");
  });

  it("nu semnalează activitățile lipite (10–12 și 12–14)", () => {
    const candidate = event("nou", "2026-10-19", "10:00", "12:00");
    const next = event("lab", "2026-10-19", "12:00", "14:00");
    const range = conflictRange(candidate);
    expect(firstConflicts(expandEvent(candidate, range), expandEvents([next], range))).toEqual([]);
  });

  it("o serie la două săptămâni nu se lovește de săptămânile libere", () => {
    const candidate = event("nou", "2026-10-26", "10:00", "12:00");
    const biweekly = event("lab", "2026-10-19", "10:00", "12:00", { recurrence: "biweekly" });
    const range = conflictRange(candidate);
    expect(firstConflicts(expandEvent(candidate, range), expandEvents([biweekly], range))).toEqual([]);
  });

  it("verifică seria doar până la data de final", () => {
    const candidate = event("nou", "2026-10-19", "10:00", "12:00", { recurrence: "weekly", recurrenceUntil: "2026-10-27" });
    const later = event("curs", "2026-11-02", "10:00", "12:00");
    const range = conflictRange(candidate);
    expect(firstConflicts(expandEvent(candidate, range), expandEvents([later], range))).toEqual([]);
  });

  it("păstrează ora locală peste schimbarea orei (25.10.2026)", () => {
    const candidate = event("nou", "2026-10-19", "08:00", "10:00", { recurrence: "weekly" });
    const afterChange = event("curs", "2026-10-26", "09:00", "11:00");
    const range = conflictRange(candidate);
    const conflicts = firstConflicts(expandEvent(candidate, range), expandEvents([afterChange], range));
    expect(conflicts.map((c) => c.event.id)).toEqual(["curs"]);
  });
});

describe("TaskFormSchema", () => {
  const task = (overrides: Record<string, string> = {}) => ({
    kind: "examen",
    title: "Examen Analiză",
    subjectId: "",
    location: "",
    notes: "",
    date: "2026-11-02",
    time: "09:00",
    durationMinutes: "120",
    estimatedMinutes: "",
    ...overrides,
  });

  it("acceptă un examen cu durată și fără estimare", () => {
    expect(TaskFormSchema.parse(task())).toMatchObject({ kind: "examen", durationMinutes: 120, estimatedMinutes: null });
  });

  it("respinge durate în afara limitelor din baza de date", () => {
    expect(TaskFormSchema.safeParse(task({ durationMinutes: "700" })).success).toBe(false);
    expect(TaskFormSchema.safeParse(task({ estimatedMinutes: "1" })).success).toBe(false);
  });

  it("cere titlu, dată și oră valide", () => {
    expect(TaskFormSchema.safeParse(task({ title: "" })).success).toBe(false);
    expect(TaskFormSchema.safeParse(task({ date: "2 noiembrie" })).success).toBe(false);
    expect(TaskFormSchema.safeParse(task({ time: "25:00" })).success).toBe(false);
  });
});

describe("grila orară", () => {
  const day = { start: new Date("2026-10-19T00:00:00Z"), end: new Date("2026-10-20T00:00:00Z") };
  const at = (h1: number, h2: number, id: string) => ({ id, start: new Date(day.start.getTime() + h1 * 3_600_000), end: new Date(day.start.getTime() + h2 * 3_600_000) });

  it("pune activitățile suprapuse pe benzi diferite și pe cele separate pe toată lățimea", () => {
    const placed = layoutLanes([at(8, 10, "a"), at(9, 11, "b"), at(12, 13, "c")], day.start, day.end);
    const byId = Object.fromEntries(placed.map((p) => [p.item.id, p]));
    expect(byId.a).toMatchObject({ lane: 0, lanes: 2, startMin: 480, endMin: 600 });
    expect(byId.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(byId.c).toMatchObject({ lane: 0, lanes: 1 });
  });

  it("refolosește banda liberă și taie ce iese din zi", () => {
    const placed = layoutLanes([at(8, 12, "a"), at(9, 10, "b"), at(10, 11, "c"), at(23, 26, "d")], day.start, day.end);
    const byId = Object.fromEntries(placed.map((p) => [p.item.id, p]));
    expect(byId.c.lane).toBe(1);
    expect(byId.d.endMin).toBe(1440);
  });

  it("extinde orele afișate doar cât e nevoie", () => {
    expect(hourRange([])).toEqual({ start: 8, end: 20 });
    expect(hourRange([{ startMin: 7 * 60 + 30, endMin: 22 * 60 + 15 }])).toEqual({ start: 7, end: 23 });
  });
});

describe("safeReturn", () => {
  it("acceptă doar vederile interne ale calendarului și pagina Azi", () => {
    expect(safeReturn("/calendar?vedere=saptamana&data=2026-10-19")).toBe("/calendar?vedere=saptamana&data=2026-10-19");
    expect(safeReturn("/azi")).toBe("/azi");
    expect(safeReturn("https://exemplu.ro")).toBe("/calendar");
    expect(safeReturn("//exemplu.ro")).toBe("/calendar");
    expect(safeReturn("/calendar?x=<script>")).toBe("/calendar");
    expect(safeReturn(undefined)).toBe("/calendar");
  });
});
