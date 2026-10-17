import type { AvailabilityWindow } from "@/lib/contracts/domain";
import { APP_TIMEZONE, dayBounds, fromLocal, isoWeekday, shiftDateKey, toDateKey } from "./zone";

export type Interval = { start: Date; end: Date };
export type BusyInterval = Interval & { id?: string; title?: string };

/** Intervale semi-deschise [start, end): o activitate care se termină la 10:00 nu se suprapune cu una de la 10:00. */
export function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

/** Activitățile ocupate care se suprapun cu intervalul candidat. */
export function findConflicts<T extends Interval>(candidate: Interval, busy: T[]): T[] {
  return busy.filter((item) => overlaps(candidate, item));
}

/** Suprapunerile dintre elementele unei liste (ex. sesiunile dintr-o propunere între ele). */
export function findInternalOverlaps<T extends Interval>(items: T[]): Array<[T, T]> {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length && sorted[j].start < sorted[i].end; j++) {
      pairs.push([sorted[i], sorted[j]]);
    }
  }
  return pairs;
}

export function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = intervals
    .filter((i) => i.end > i.start)
    .map((i) => ({ start: i.start, end: i.end }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [];
  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (last && current.start <= last.end) {
      if (current.end > last.end) last.end = current.end;
    } else {
      merged.push(current);
    }
  }
  return merged;
}

/** Fereastra implicită când studentul nu și-a setat disponibilitatea: zilnic 08:00–22:00. */
export const DEFAULT_AVAILABILITY: AvailabilityWindow[] = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  start: "08:00",
  end: "22:00",
}));

export type FreeSlotOptions = {
  range: Interval;
  busy: Interval[];
  availability?: AvailabilityWindow[];
  /** Durata minimă a unui interval util. */
  minMinutes?: number;
  /** Pauză păstrată înainte și după fiecare activitate ocupată. */
  bufferMinutes?: number;
  /** Nu propune nimic mai devreme de acest moment (ex. acum). */
  notBefore?: Date;
  tz?: string;
};

/**
 * Calculează intervalele libere din disponibilitatea studentului, scăzând activitățile ocupate.
 * Codul decide CE e liber; AI-ul doar recomandă cum se folosesc aceste intervale.
 */
export function computeFreeSlots({
  range,
  busy,
  availability = [],
  minMinutes = 30,
  bufferMinutes = 10,
  notBefore,
  tz = APP_TIMEZONE,
}: FreeSlotOptions): Interval[] {
  const windows = availability.length > 0 ? availability : DEFAULT_AVAILABILITY;
  const lowerBound = notBefore && notBefore > range.start ? notBefore : range.start;
  const bufferMs = bufferMinutes * 60_000;
  const blocked = mergeIntervals(
    busy.map((b) => ({ start: new Date(b.start.getTime() - bufferMs), end: new Date(b.end.getTime() + bufferMs) })),
  );

  const result: Interval[] = [];
  const lastDate = toDateKey(new Date(range.end.getTime() - 1), tz);
  for (let date = toDateKey(range.start, tz); date <= lastDate; date = shiftDateKey(date, 1)) {
    const weekday = isoWeekday(date);
    const day = dayBounds(date, tz);
    for (const window of windows.filter((w) => w.weekday === weekday)) {
      const windowStart = fromLocal(date, window.start, tz);
      const windowEnd = window.end === "24:00" ? day.end : fromLocal(date, window.end, tz);
      const start = maxDate(windowStart, lowerBound);
      const end = minDate(windowEnd, range.end);
      if (end <= start) continue;
      result.push(...subtract({ start, end }, blocked));
    }
  }

  return mergeIntervals(result).filter((slot) => slot.end.getTime() - slot.start.getTime() >= minMinutes * 60_000);
}

function subtract(base: Interval, blocked: Interval[]): Interval[] {
  const pieces: Interval[] = [];
  let cursor = base.start;
  for (const b of blocked) {
    if (b.end <= cursor || b.start >= base.end) continue;
    if (b.start > cursor) pieces.push({ start: cursor, end: minDate(b.start, base.end) });
    if (b.end > cursor) cursor = b.end;
    if (cursor >= base.end) break;
  }
  if (cursor < base.end) pieces.push({ start: cursor, end: base.end });
  return pieces;
}

const maxDate = (a: Date, b: Date) => (a > b ? a : b);
const minDate = (a: Date, b: Date) => (a < b ? a : b);
