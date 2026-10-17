import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";

export const APP_TIMEZONE = "Europe/Bucharest";
export const APP_LOCALE = "ro-RO";

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isDateKey(value: string) {
  return DATE_KEY_RE.test(value);
}

export function isTimeOfDay(value: string) {
  return TIME_RE.test(value);
}

/** Data locală (YYYY-MM-DD) a unui moment, în fusul dat. */
export function toDateKey(instant: Date, tz = APP_TIMEZONE) {
  const d = new TZDate(instant.getTime(), tz);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Ora locală (HH:MM) a unui moment, în fusul dat. */
export function toTimeOfDay(instant: Date, tz = APP_TIMEZONE) {
  const d = new TZDate(instant.getTime(), tz);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Convertește o dată + oră locală în moment absolut.
 * O oră inexistentă (ex. 03:30 în noaptea trecerii la ora de vară) este mutată după salt.
 */
export function fromLocal(dateKey: string, time: string, tz = APP_TIMEZONE): Date {
  const dm = DATE_KEY_RE.exec(dateKey);
  const tm = TIME_RE.exec(time);
  if (!dm || !tm) throw new Error(`Dată sau oră invalidă: ${dateKey} ${time}`);
  const d = new TZDate(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]), tz);
  return new Date(d.getTime());
}

/** Începutul și sfârșitul (exclusiv) zilei locale. Zilele cu schimbare de oră au 23 sau 25 de ore. */
export function dayBounds(dateKey: string, tz = APP_TIMEZONE) {
  const start = fromLocal(dateKey, "00:00", tz);
  const end = fromLocal(shiftDateKey(dateKey, 1), "00:00", tz);
  return { start, end };
}

/** Adună zile calendaristice la o dată locală (fără a trece prin ore). */
export function shiftDateKey(dateKey: string, days: number) {
  const dm = DATE_KEY_RE.exec(dateKey);
  if (!dm) throw new Error(`Dată invalidă: ${dateKey}`);
  const utc = addDays(new Date(Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]))), days);
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

/** Ziua săptămânii ISO (1 = luni … 7 = duminică) pentru o dată locală. */
export function isoWeekday(dateKey: string) {
  const dm = DATE_KEY_RE.exec(dateKey);
  if (!dm) throw new Error(`Dată invalidă: ${dateKey}`);
  const day = new Date(Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]))).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Numărul de zile calendaristice dintre două date locale (b − a). */
export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Luni-ul săptămânii care conține data locală. */
export function startOfWeekKey(dateKey: string) {
  return shiftDateKey(dateKey, 1 - isoWeekday(dateKey));
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
