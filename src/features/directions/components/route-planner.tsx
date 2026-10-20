"use client";

import { ArrowDownUp, ArrowUpRight, Clock3, Crosshair, LoaderCircle, Navigation, Route as RouteIcon, Smartphone } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Alert } from "@/components/ui/alert";
import { Segmented } from "@/components/ui/segmented";
import { formatDuration } from "@/lib/time/format";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/time/zone";
import { cn } from "@/lib/utils";
import { fetchRoute, formatDistance, nativeMapsUrl, osmDirectionsUrl, type RouteResult, type TravelMode } from "../osm";
import type { Place } from "../places";
import { PlaceInput } from "./place-input";
import { RouteMap } from "./route-map";

const MODES: { value: TravelMode; label: string }[] = [
  { value: "foot", label: "Pe jos" },
  { value: "car", label: "Mașină" },
  { value: "bike", label: "Bicicletă" },
];

const arrival = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// Telefonul (pentru butonul „Aplicația de hărți”): pe server nu știm, deci butonul apare doar în browser.
const noop = () => () => {};
function usePlatform() {
  return useSyncExternalStore(
    noop,
    () => (/iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : /android/i.test(navigator.userAgent) ? "android" : "desktop"),
    () => "desktop" as const,
  );
}

const dot = (kind: "from" | "to") => (
  <span className={cn("flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white", kind === "from" ? "bg-accent-blue" : "bg-accent")}>
    {kind === "from" ? "A" : "B"}
  </span>
);

export function RoutePlanner() {
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [mode, setMode] = useState<TravelMode>("foot");
  const [route, setRoute] = useState<(RouteResult & { arrivesAt: number }) | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "none">("idle");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const platform = usePlatform();

  const ready = from && to && (from.lat !== to.lat || from.lng !== to.lng);

  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    // Starea de încărcare se pune într-un microtask, nu sincron în efect.
    queueMicrotask(() => setStatus("loading"));
    fetchRoute(from, to, mode, ctrl.signal)
      .then((r) => {
        setRoute(r ? { ...r, arrivesAt: Date.now() + r.duration * 1000 } : null);
        setStatus(r ? "idle" : "none");
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) {
          console.warn("Traseul nu a putut fi calculat", e);
          setStatus("error");
        }
      });
    return () => ctrl.abort();
  }, [from, to, mode, ready]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoError("Browserul tău nu poate afla locația.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        setFrom({ id: "me", name: "Locația mea", detail: `precizie ~${Math.round(coords.accuracy)} m`, group: "Repere", lat: coords.latitude, lng: coords.longitude });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Ai refuzat accesul la locație. Îl poți permite din setările browserului sau alegi plecarea din listă."
            : "Nu am putut afla locația. Încearcă din nou sau alege plecarea din listă.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  const shownRoute = ready ? route : null;
  const minutes = shownRoute ? Math.max(1, Math.round(shownRoute.duration / 60)) : 0;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:gap-6">
      <section aria-label="Alege traseul" className="stagger flex flex-col self-start gap-5 rounded-xl border border-line/70 bg-surface p-5 shadow-sm sm:p-6">
        <div className="relative flex flex-col gap-4">
          <PlaceInput
            id="plecare"
            label="Plecare"
            marker={dot("from")}
            value={from}
            onChange={setFrom}
            placeholder="Facultate, bibliotecă sau adresă"
            action={
              <button
                type="button"
                onClick={locate}
                disabled={locating}
                title="Folosește locația mea"
                aria-label="Folosește locația mea"
                className="flex size-12 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface-muted/60 text-ink-muted transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink disabled:opacity-60"
              >
                {locating ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Crosshair className="size-5" aria-hidden="true" />}
              </button>
            }
          />
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            disabled={!from && !to}
            title="Inversează plecarea cu sosirea"
            aria-label="Inversează plecarea cu sosirea"
            className="absolute top-[calc(50%-2px)] right-[60px] z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface text-ink-muted shadow-sm transition-colors hover:border-accent-line hover:text-accent-ink disabled:opacity-50"
          >
            <ArrowDownUp className="size-4" aria-hidden="true" />
          </button>
          <PlaceInput id="sosire" label="Sosire" marker={dot("to")} value={to} onChange={setTo} placeholder="Unde vrei să ajungi?" />
        </div>
        {geoError ? <Alert tone="warning">{geoError}</Alert> : null}

        <Segmented label="Cum te deplasezi" options={MODES} value={mode} onChange={setMode} className="w-full" />

        {/* Rezultatul */}
        <div aria-live="polite">
          {!ready ? (
            <div className="flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-6 text-center">
              <RouteIcon className="size-6 text-ink-faint" aria-hidden="true" />
              <p className="text-sm text-ink-muted">Alege de unde pleci și unde vrei să ajungi.</p>
            </div>
          ) : status === "loading" && !shownRoute ? (
            <div className="flex min-h-[110px] items-center justify-center gap-2 rounded-lg bg-surface-muted/60 text-sm text-ink-muted">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Calculez traseul…
            </div>
          ) : status === "error" ? (
            <Alert tone="danger">Nu am putut calcula traseul acum. Verifică conexiunea și încearcă din nou.</Alert>
          ) : status === "none" || !shownRoute ? (
            <Alert tone="warning">Nu am găsit un drum între aceste două locuri pentru modul ales.</Alert>
          ) : (
            <div className={cn("relative overflow-hidden rounded-lg border border-accent-line/70 bg-accent-soft/60 p-4 transition-opacity", status === "loading" && "opacity-60")}>
              <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-accent/20 blur-2xl" />
              <div className="relative flex items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold tracking-[0.08em] text-accent-ink uppercase">{MODES.find((m) => m.value === mode)?.label}</p>
                  <p className="mt-1 font-clock text-[34px] leading-none font-bold tracking-[-0.03em] text-ink">{formatDuration(minutes)}</p>
                </div>
                <div className="text-right">
                  <p className="font-clock text-[17px] font-semibold text-ink-soft">{formatDistance(shownRoute.distance)}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-ink-muted">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    ajungi pe la {arrival.format(shownRoute.arrivesAt)}
                  </p>
                </div>
              </div>
              {mode === "car" ? (
                <p className="relative mt-3 text-[12px] leading-4 text-ink-muted">Estimare fără trafic. Pentru trafic în timp real, pornește navigarea în aplicația de hărți.</p>
              ) : null}
            </div>
          )}
        </div>

        {ready ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={osmDirectionsUrl(from, to, mode)}
              target="_blank"
              rel="noopener noreferrer"
              className="shine relative inline-flex h-11 flex-auto items-center justify-center gap-2 rounded-md bg-brand px-4 text-[14px] font-semibold text-white shadow-accent transition-transform active:scale-[0.98]"
            >
              <Navigation className="size-4" aria-hidden="true" />
              Pornește în OpenStreetMap
              <span className="sr-only">(se deschide într-o filă nouă)</span>
            </a>
            {platform !== "desktop" ? (
              <a
                href={nativeMapsUrl(to, to.name, platform)}
                className="inline-flex h-11 flex-auto items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[14px] font-semibold text-ink transition-colors hover:border-accent-line"
              >
                <Smartphone className="size-4" aria-hidden="true" />
                Aplicația de hărți
                <ArrowUpRight className="size-3.5 text-ink-faint" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="stagger relative h-[360px] overflow-hidden rounded-xl border border-line/70 bg-surface-muted shadow-sm sm:h-[460px] xl:sticky xl:top-6 xl:h-[calc(100dvh-9rem)] xl:min-h-[520px]" style={{ "--i": 1 } as React.CSSProperties}>
        <RouteMap from={from} to={to} path={shownRoute?.path ?? null} />
      </div>
    </div>
  );
}
