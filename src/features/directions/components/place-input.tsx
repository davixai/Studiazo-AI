"use client";

import { LoaderCircle, MapPin, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { searchPlaces } from "../osm";
import { filterPlaces, type Place } from "../places";

// Câmp cu sugestii: lista gata făcută (universități, facultăți, biblioteci) se filtrează pe loc,
// iar de la 3 litere apar și adrese din OpenStreetMap. Navigabil cu săgețile, Enter și Escape.

type Props = {
  id: string;
  label: string;
  marker: ReactNode;
  value: Place | null;
  onChange: (place: Place | null) => void;
  placeholder: string;
  /** Buton în dreapta câmpului (ex. „Locația mea”). */
  action?: ReactNode;
};

export function PlaceInput({ id, label, marker, value, onChange, placeholder, action }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const local = useMemo(() => filterPlaces(query), [query]);
  const options = useMemo(() => [...local, ...remote.filter((r) => !local.some((l) => l.name === r.name))], [local, remote]);

  // Căutare în OpenStreetMap, cu o mică pauză după ultima literă (nu la fiecare tastă).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchPlaces(q, ctrl.signal)
        .then(setRemote)
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 400);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function pick(place: Place) {
    onChange(place);
    setQuery("");
    setRemote([]);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (options.length) setActive((i) => (i + (e.key === "ArrowDown" ? 1 : options.length - 1)) % options.length);
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const shown = open ? query : value ? value.name : query;
  const remoteStart = local.length;

  return (
    <div ref={wrap} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
            {marker}
          </span>
          <input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            value={shown}
            placeholder={placeholder}
            onFocus={() => {
              setOpen(true);
              setActive(0);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
              if (e.target.value.trim().length < 3) setRemote([]);
            }}
            onKeyDown={onKeyDown}
            className="h-12 w-full truncate rounded-md border border-line-strong bg-surface-sunken pr-10 pl-11 text-[15px] text-ink shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-ink-faint hover:border-ink-faint focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none"
          />
          {searching ? (
            <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-ink-faint" aria-hidden="true" />
          ) : value && !open ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Șterge ${label.toLowerCase()}`}
              className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        {action}
      </div>
      {value?.approx && !open ? (
        <p className="mt-1.5 text-[12px] leading-4 text-ink-faint">Aproximativ: sediul universității ({value.detail?.split(" · ")[1]}).</p>
      ) : null}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto overscroll-contain rounded-lg border border-line bg-surface p-1.5 shadow-lg animate-fade-in"
        >
          {options.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-ink-muted">{searching ? "Caut în hartă…" : "Niciun loc găsit. Încearcă altă denumire sau o adresă."}</li>
          ) : (
            options.map((place, i) => {
              const header =
                i === remoteStart && remote.length
                  ? "Din hartă"
                  : i < remoteStart && (i === 0 || options[i - 1].group !== place.group)
                    ? place.group
                    : null;
              return (
                <li key={place.id} role="presentation">
                  {header ? (
                    <p role="presentation" className="px-2.5 pt-2.5 pb-1 text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
                      {header}
                    </p>
                  ) : null}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => pick(place)}
                    onPointerEnter={() => setActive(i)}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2",
                      i === active ? "bg-accent-soft text-ink" : "text-ink-soft",
                    )}
                  >
                    <MapPin className={cn("mt-0.5 size-4 shrink-0", i === active ? "text-accent-ink" : "text-ink-faint")} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-[14px] leading-5 font-medium">{place.name}</span>
                      {place.detail ? <span className="block truncate text-[12px] leading-4 text-ink-muted">{place.detail}</span> : null}
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
