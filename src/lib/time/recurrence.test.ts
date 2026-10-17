import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/lib/contracts/domain";
import { expandEvent } from "./recurrence";
import { dayBounds, fromLocal, toTimeOfDay } from "./zone";

function course(partial: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    subjectId: null,
    kind: "curs",
    title: "Curs",
    location: null,
    notes: null,
    startsAt: fromLocal("2026-10-19", "08:00").toISOString(), // luni
    endsAt: fromLocal("2026-10-19", "10:00").toISOString(),
    timezone: "Europe/Bucharest",
    recurrence: "weekly",
    recurrenceUntil: null,
    excludedDates: [],
    completedAt: null,
    proposalId: null,
    ...partial,
  };
}

const range = (from: string, to: string) => ({ start: dayBounds(from).start, end: dayBounds(to).end });

describe("recurența activităților", () => {
  it("păstrează ora locală 08:00 peste schimbarea orei", () => {
    const occ = expandEvent(course(), range("2026-10-19", "2026-11-02"));
    expect(occ.map((o) => o.occurrenceDate)).toEqual(["2026-10-19", "2026-10-26", "2026-11-02"]);
    expect(occ.map((o) => toTimeOfDay(o.start))).toEqual(["08:00", "08:00", "08:00"]);
    // Momentul UTC se schimbă: 05:00Z înainte, 06:00Z după.
    expect(occ[0].start.toISOString()).toBe("2026-10-19T05:00:00.000Z");
    expect(occ[1].start.toISOString()).toBe("2026-10-26T06:00:00.000Z");
    expect(occ.every((o) => o.end.getTime() - o.start.getTime() === 2 * 3_600_000)).toBe(true);
  });

  it("respectă săptămânile alternative și datele excluse", () => {
    const occ = expandEvent(
      course({ recurrence: "biweekly", excludedDates: ["2026-11-02"] }),
      range("2026-10-19", "2026-11-30"),
    );
    expect(occ.map((o) => o.occurrenceDate)).toEqual(["2026-10-19", "2026-11-16", "2026-11-30"]);
  });

  it("se oprește la data de final a recurenței", () => {
    const occ = expandEvent(course({ recurrenceUntil: "2026-11-01" }), range("2026-10-19", "2026-12-31"));
    expect(occ.map((o) => o.occurrenceDate)).toEqual(["2026-10-19", "2026-10-26"]);
  });

  it("găsește aparițiile dintr-un interval îndepărtat fără a itera din trecut", () => {
    const occ = expandEvent(course(), range("2027-05-03", "2027-05-09"));
    expect(occ).toHaveLength(1);
    expect(occ[0].occurrenceDate).toBe("2027-05-03");
    expect(toTimeOfDay(occ[0].start)).toBe("08:00");
  });

  it("include o activitate unică doar dacă intersectează intervalul", () => {
    const single = course({ recurrence: "none" });
    expect(expandEvent(single, range("2026-10-19", "2026-10-19"))).toHaveLength(1);
    expect(expandEvent(single, range("2026-10-20", "2026-10-25"))).toHaveLength(0);
  });
});
