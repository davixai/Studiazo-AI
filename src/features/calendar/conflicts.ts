import type { CalendarEvent, EventOccurrence } from "@/lib/contracts/domain";
import type { Range } from "@/lib/time/recurrence";
import { findConflicts } from "@/lib/time/slots";
import { dayBounds } from "@/lib/time/zone";

/** Cât de departe verificăm suprapunerile unei activități recurente (un semestru). */
export const CONFLICT_HORIZON_WEEKS = 16;

/** Intervalul în care căutăm suprapuneri: o singură apariție sau seria, până la final ori un semestru. */
export function conflictRange(event: CalendarEvent): Range {
  const start = new Date(event.startsAt);
  if (event.recurrence === "none") return { start, end: new Date(event.endsAt) };
  const horizon = new Date(start.getTime() + CONFLICT_HORIZON_WEEKS * 7 * 86_400_000);
  const until = event.recurrenceUntil ? dayBounds(event.recurrenceUntil, event.timezone).end : horizon;
  return { start, end: until < horizon ? until : horizon };
}

/**
 * Prima apariție suprapusă din fiecare altă activitate (un curs săptămânal apare o singură dată în listă).
 * `mine` = aparițiile activității verificate; `others` = restul programului, fără activitatea însăși.
 */
export function firstConflicts(mine: EventOccurrence[], others: EventOccurrence[]): EventOccurrence[] {
  const byEvent = new Map<string, EventOccurrence>();
  for (const occurrence of mine) {
    for (const other of findConflicts(occurrence, others)) {
      const seen = byEvent.get(other.event.id);
      if (!seen || other.start < seen.start) byEvent.set(other.event.id, other);
    }
  }
  return [...byEvent.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
}
