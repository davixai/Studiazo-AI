"use client";

import { useSyncExternalStore } from "react";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/time/zone";
import { cn } from "@/lib/utils";

// Ceasul României, în timp real (Europe/Bucharest, cu ora de vară/iarnă corectă), indiferent de fusul dispozitivului.
// Pe server nu are oră (null), ca să nu apară diferențe la hidratare; în browser se actualizează în fiecare secundă.

const time = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const timeShort = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dateLong = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dateShort = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, weekday: "short", day: "numeric", month: "short" });

function subscribe(onTick: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const tick = () => {
    onTick();
    // Aliniat la începutul secundei următoare, ca secundele să nu „sară”.
    timer = setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  timer = setTimeout(tick, 1000 - (Date.now() % 1000));
  return () => clearTimeout(timer);
}

const currentSecond = () => Math.floor(Date.now() / 1000);
const noTimeOnServer = () => null;

function useNowSeconds() {
  return useSyncExternalStore(subscribe, currentSecond, noTimeOnServer);
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase(APP_LOCALE) + s.slice(1);

/** Card în bara laterală: ora mare, cu secunde, și data completă. */
export function LiveClockCard({ className }: { className?: string }) {
  const seconds = useNowSeconds();
  const now = seconds === null ? null : new Date(seconds * 1000);

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border border-line bg-surface-muted/60 px-3.5 py-3", className)}
      role="timer"
      aria-live="off"
      aria-label={now ? `Ora României: ${timeShort.format(now)}, ${dateLong.format(now)}` : "Ora României"}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -top-8 -right-8 size-20 rounded-full bg-accent/15 blur-2xl" />
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-ink-faint uppercase">
        <span className="relative flex size-1.5" aria-hidden="true">
          <span className="absolute inset-0 animate-ping rounded-full bg-success/70" />
          <span className="relative size-1.5 rounded-full bg-success" />
        </span>
        Ora României
      </p>
      <p className="tabular mt-1 font-display text-[26px] leading-none font-bold tracking-[-0.02em] text-ink" aria-hidden="true">
        {now ? time.format(now) : "--:--:--"}
      </p>
      <p className="mt-1.5 truncate text-[12px] text-ink-muted" aria-hidden="true">
        {now ? capitalize(dateLong.format(now)) : " "}
      </p>
    </div>
  );
}

/** Variantă compactă pentru bara de sus pe telefon: ora și data scurtă. */
export function LiveClockCompact({ className }: { className?: string }) {
  const seconds = useNowSeconds();
  const now = seconds === null ? null : new Date(seconds * 1000);

  return (
    <div
      className={cn("flex flex-col items-end leading-tight", className)}
      role="timer"
      aria-live="off"
      aria-label={now ? `Ora României: ${timeShort.format(now)}, ${dateLong.format(now)}` : "Ora României"}
    >
      <span className="tabular text-[15px] font-bold text-ink" aria-hidden="true">
        {now ? time.format(now) : "--:--:--"}
      </span>
      <span className="text-[11px] text-ink-muted" aria-hidden="true">
        {now ? dateShort.format(now) : " "}
      </span>
    </div>
  );
}
