import type { CalendarEvent, EventOccurrence } from "@/lib/contracts/domain";
import { daysBetween, fromLocal, shiftDateKey, toDateKey, toTimeOfDay } from "./zone";

export type Range = { start: Date; end: Date };

const STEP_DAYS = { weekly: 7, biweekly: 14 } as const;

/**
 * Extinde o activitate (eventual recurentă) în aparițiile care intersectează intervalul.
 * Recurența păstrează ORA LOCALĂ din fusul activității: un curs de luni la 08:00 rămâne
 * la 08:00 și după schimbarea orei (durata, în minute reale, se păstrează).
 */
export function expandEvent(event: CalendarEvent, range: Range): EventOccurrence[] {
  const firstStart = new Date(event.startsAt);
  const firstEnd = new Date(event.endsAt);
  const durationMs = firstEnd.getTime() - firstStart.getTime();
  if (!(durationMs > 0)) return [];

  if (event.recurrence === "none") {
    return intersects(firstStart, firstEnd, range)
      ? [{ event, occurrenceDate: toDateKey(firstStart, event.timezone), start: firstStart, end: firstEnd }]
      : [];
  }

  const step = STEP_DAYS[event.recurrence];
  const firstDate = toDateKey(firstStart, event.timezone);
  const startTime = toTimeOfDay(firstStart, event.timezone);
  const excluded = new Set(event.excludedDates);

  // Sare direct aproape de începutul intervalului, fără a itera din trecut.
  const rangeStartDate = toDateKey(new Date(range.start.getTime() - durationMs), event.timezone);
  const skip = Math.max(0, Math.floor(daysBetween(firstDate, rangeStartDate) / step) - 1);

  const occurrences: EventOccurrence[] = [];
  for (let k = skip; k < skip + 1000; k++) {
    const date = shiftDateKey(firstDate, k * step);
    if (event.recurrenceUntil && date > event.recurrenceUntil) break;
    const start = fromLocal(date, startTime, event.timezone);
    if (start >= range.end) break;
    const end = new Date(start.getTime() + durationMs);
    if (!excluded.has(date) && intersects(start, end, range)) {
      occurrences.push({ event, occurrenceDate: date, start, end });
    }
  }
  return occurrences;
}

export function expandEvents(events: CalendarEvent[], range: Range): EventOccurrence[] {
  return events.flatMap((event) => expandEvent(event, range)).sort((a, b) => a.start.getTime() - b.start.getTime());
}

function intersects(start: Date, end: Date, range: Range) {
  return start < range.end && end > range.start;
}
