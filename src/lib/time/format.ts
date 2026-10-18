import { APP_LOCALE, APP_TIMEZONE, daysBetween, toDateKey } from "./zone";

// Formatare în limba română, mereu în fusul explicit (nu în fusul serverului).

export function formatTime(instant: Date, tz = APP_TIMEZONE) {
  return new Intl.DateTimeFormat(APP_LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(instant);
}

export function formatTimeRange(start: Date, end: Date, tz = APP_TIMEZONE) {
  return `${formatTime(start, tz)} – ${formatTime(end, tz)}`;
}

/** „sâmbătă, 17 octombrie” */
export function formatDayLong(instant: Date, tz = APP_TIMEZONE) {
  return new Intl.DateTimeFormat(APP_LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(
    instant,
  );
}

/** „17 octombrie 2026” */
export function formatDateLong(instant: Date, tz = APP_TIMEZONE) {
  return new Intl.DateTimeFormat(APP_LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(instant);
}

/** „17 oct.” */
export function formatDayShort(instant: Date, tz = APP_TIMEZONE) {
  return new Intl.DateTimeFormat(APP_LOCALE, { day: "numeric", month: "short", timeZone: tz }).format(instant);
}

/** „lun.” */
export function formatWeekdayShort(instant: Date, tz = APP_TIMEZONE) {
  return new Intl.DateTimeFormat(APP_LOCALE, { weekday: "short", timeZone: tz }).format(instant);
}

/** „azi”, „mâine”, „în 3 zile”, „acum 2 zile” — relativ la zilele calendaristice locale. */
export function formatRelativeDay(instant: Date, now = new Date(), tz = APP_TIMEZONE) {
  const diff = daysBetween(toDateKey(now, tz), toDateKey(instant, tz));
  if (diff === 0) return "azi";
  if (diff === 1) return "mâine";
  if (diff === -1) return "ieri";
  if (diff > 1) return diff < 20 ? `în ${diff} zile` : `în ${diff} de zile`;
  const past = -diff;
  return past < 20 ? `acum ${past} zile` : `acum ${past} de zile`;
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? "1 oră" : `${h}${h >= 20 ? " de" : ""} ore`;
  return `${h} h ${m} min`;
}

/** Salutul în funcție de ora locală. */
export function greetingFor(instant: Date, tz = APP_TIMEZONE) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: tz }).format(instant));
  if (hour < 5) return "Bună seara";
  if (hour < 12) return "Bună dimineața";
  if (hour < 18) return "Bună ziua";
  return "Bună seara";
}
