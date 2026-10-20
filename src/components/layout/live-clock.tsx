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
const weekday = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, weekday: "long" });
const dayMonthYear = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, day: "numeric", month: "long", year: "numeric" });

// Ora exactă: ceasul dispozitivului poate fi înainte sau în urmă, așa că măsurăm diferența față de server
// (ca NTP: ora serverului minus mijlocul cererii, din cea mai rapidă dintre câteva încercări) și o re-măsurăm periodic.
const RESYNC_MS = 10 * 60 * 1000;
let offset = 0;
let lastSync = 0;
let syncing: Promise<void> | null = null;

async function measureOffset() {
  let bestRoundTrip = Infinity;
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    const res = await fetch("/api/time", { cache: "no-store" });
    const t1 = Date.now();
    if (!res.ok) return;
    const { now } = (await res.json()) as { now?: unknown };
    if (typeof now !== "number") return;
    if (t1 - t0 < bestRoundTrip) {
      bestRoundTrip = t1 - t0;
      offset = now - (t0 + t1) / 2;
    }
  }
  lastSync = Date.now();
}

function syncIfStale() {
  if (!syncing && Date.now() - lastSync > RESYNC_MS) {
    // Fără rețea rămâne ora dispozitivului; încercăm din nou la următorul prilej.
    syncing = measureOffset()
      .catch(() => {})
      .finally(() => {
        syncing = null;
      });
  }
  return syncing ?? Promise.resolve();
}

const exactNow = () => Date.now() + offset;

function subscribe(onTick: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    clearTimeout(timer);
    // Aliniat la începutul secundei exacte următoare, ca secundele să nu „sară”.
    timer = setTimeout(tick, 1000 - (exactNow() % 1000));
  };
  const tick = () => {
    onTick();
    schedule();
  };
  // La revenirea în tab (timerele sunt încetinite în fundal) sau în rețea: actualizare imediată și re-sincronizare.
  const refresh = () => {
    if (document.visibilityState !== "visible") return;
    tick();
    void syncIfStale().then(tick);
  };
  schedule();
  void syncIfStale().then(tick);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("online", refresh);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", refresh);
    window.removeEventListener("online", refresh);
  };
}

const currentSecond = () => Math.floor(exactNow() / 1000);
const noTimeOnServer = () => null;

function useNowSeconds() {
  return useSyncExternalStore(subscribe, currentSecond, noTimeOnServer);
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase(APP_LOCALE) + s.slice(1);

/** Card în bara laterală: ziua (serif italic), ora mare cu secundele estompate, apoi data. */
export function LiveClockCard({ className }: { className?: string }) {
  const seconds = useNowSeconds();
  const now = seconds === null ? null : new Date(seconds * 1000);
  const hms = now ? time.format(now) : "--:--:--";

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border border-line/70 bg-surface-muted/50 px-4 py-3.5", className)}
      role="timer"
      aria-live="off"
      aria-label={now ? `Ora României: ${timeShort.format(now)}, ${dateLong.format(now)}` : "Ora României"}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-accent/20 blur-2xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-10 size-24 rounded-full bg-accent-blue/10 blur-2xl" />
      <div className="relative" aria-hidden="true">
        <p className="font-clock text-[18px] leading-tight font-semibold tracking-[-0.01em] text-accent-ink">
          {now ? capitalize(weekday.format(now)) : " "}
        </p>
        <p className="tabular mt-2 font-clock text-[36px] leading-none font-bold tracking-[-0.025em] whitespace-nowrap text-ink">
          {hms.slice(0, 5)}
          <span className="text-accent-ink">{hms.slice(5)}</span>
        </p>
        <p className="mt-2.5 truncate font-clock text-[15px] leading-tight font-medium tracking-[-0.01em] text-ink-soft">
          {now ? dayMonthYear.format(now) : " "}
        </p>
      </div>
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
      <span className="tabular font-clock text-[15px] font-bold tracking-[-0.02em] text-ink" aria-hidden="true">
        {now ? time.format(now) : "--:--:--"}
      </span>
      <span className="font-clock text-[11px] text-ink-muted" aria-hidden="true">
        {now ? dateShort.format(now) : " "}
      </span>
    </div>
  );
}
