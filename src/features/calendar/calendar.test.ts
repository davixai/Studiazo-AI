import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/lib/contracts/domain";
import { expandEvent, expandEvents } from "@/lib/time/recurrence";
import { fromLocal } from "@/lib/time/zone";
import { conflictRange, firstConflicts } from "./conflicts";
import { EventFormSchema } from "./schemas";

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

  it("respinge ora de sfârșit înaintea celei de început", () => {
    const result = EventFormSchema.safeParse(form({ startTime: "12:00", endTime: "10:00" }));
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
