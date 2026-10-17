import { countLabel } from "@/features/subjects/format";
import { formatDateLong, formatDayShort, formatRelativeDay } from "@/lib/time/format";
import { APP_TIMEZONE, daysBetween, toDateKey } from "@/lib/time/zone";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * „chiar acum”, „acum 5 minute”, „acum o oră”, „acum 3 ore”, „ieri”, „acum 4 zile”, „3 oct.”, „3 octombrie 2025”.
 * Sub 24 de ore numărăm orele; după aceea, zilele calendaristice locale (Europe/Bucharest).
 */
export function formatRelativeTime(instant: Date, now = new Date(), tz = APP_TIMEZONE) {
  const diff = now.getTime() - instant.getTime();
  if (diff < MINUTE) return "chiar acum"; // include ceasurile ușor desincronizate (diferență negativă)
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return minutes === 1 ? "acum un minut" : `acum ${countLabel(minutes, "minut", "minute")}`;
  }
  const days = daysBetween(toDateKey(instant, tz), toDateKey(now, tz));
  // Ziua schimbării orei are 25 de ore, deci „acum 24 de ore” poate fi tot azi: atunci rămânem la ore.
  if (diff < 24 * HOUR || days === 0) {
    const hours = Math.floor(diff / HOUR);
    return hours === 1 ? "acum o oră" : `acum ${countLabel(hours, "oră", "ore")}`;
  }
  if (days < 7) return formatRelativeDay(instant, now, tz); // „ieri”, „acum 3 zile”
  const sameYear = toDateKey(instant, tz).slice(0, 4) === toDateKey(now, tz).slice(0, 4);
  return sameYear ? formatDayShort(instant, tz) : formatDateLong(instant, tz);
}

const numberFormat = new Intl.NumberFormat("ro-RO");

/** „1.234” — separatorul de mii românesc. */
export function formatCount(n: number) {
  return numberFormat.format(n);
}
