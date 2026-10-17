"use client";

import { ChevronLeft, ChevronRight, ExternalLink, ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatBytes } from "../format";
import { DeleteMaterial } from "./material-actions";
import type { MaterialItem } from "./pdf-list";

/* eslint-disable @next/next/no-img-element -- pozele sunt private: vin printr-o redirecționare către un URL semnat,
   pe care optimizatorul de imagini Next nu îl poate prelua; dimensiunile nu sunt cunoscute dinainte. */

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;
const fileUrl = (p: MaterialItem, thumb = false) => `/materii/${p.subjectId}/fisier/${p.id}${thumb ? "?v=thumb" : ""}`;

export function PhotoGrid({ photos }: { photos: MaterialItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const photo = index === null ? undefined : photos[index];

  return (
    <>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id} className="stagger" style={delay(Math.min(i, 8))}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-line/70 bg-surface-sunken shadow-xs transition-[box-shadow,transform] duration-200 hover:shadow-md active:scale-[0.98]"
              aria-label={`Deschide „${p.title}”`}
            >
              <Thumb photo={p} />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent px-2.5 pt-8 pb-2 text-left">
                <span className="block truncate text-[12px] font-semibold text-white">{p.title}</span>
                <span className="block text-[11px] text-white/80">{p.addedLabel}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={Boolean(photo)}
        onClose={() => setIndex(null)}
        size="lg"
        title={photo?.title ?? ""}
        description={photo ? `Adăugată ${photo.addedLabel} · ${formatBytes(photo.sizeBytes)}` : undefined}
      >
        {photo && index !== null ? (
          <Lightbox
            key={photo.id} // fiecare poză pornește din nou de la „se încarcă”
            photo={photo}
            position={index + 1}
            total={photos.length}
            onPrev={index > 0 ? () => setIndex(index - 1) : undefined}
            onNext={index < photos.length - 1 ? () => setIndex(index + 1) : undefined}
          />
        ) : null}
      </Dialog>
    </>
  );
}

/**
 * Miniatura e randată și pe server, deci se poate încărca înainte ca React să atașeze `onLoad`:
 * fără stare de încărcare (ar rămâne invizibilă); pictograma de dedesubt se vede doar dacă poza lipsește.
 */
function Thumb({ photo }: { photo: MaterialItem }) {
  return (
    <>
      <span className="absolute inset-0 flex items-center justify-center text-ink-faint">
        <ImageOff className="size-6" aria-hidden="true" />
      </span>
      <img
        src={fileUrl(photo, true)}
        alt=""
        loading="lazy"
        decoding="async"
        className="relative size-full animate-fade-in object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    </>
  );
}

type LightboxProps = { photo: MaterialItem; position: number; total: number; onPrev?: () => void; onNext?: () => void };

function Lightbox({ photo, position, total, onPrev, onNext }: LightboxProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const touchX = useRef<number | null>(null);
  const target = { id: photo.id, subjectId: photo.subjectId, title: photo.title };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative flex min-h-[40dvh] items-center justify-center overflow-hidden rounded-md bg-surface-sunken sm:min-h-80"
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          touchX.current = null;
          if (start === null || end === undefined || Math.abs(end - start) < 50) return;
          if (end < start) onNext?.();
          else onPrev?.();
        }}
      >
        {state === "loading" ? <Spinner className="absolute size-6 text-accent" label="Se încarcă poza" /> : null}
        {state === "error" ? (
          <p className="flex flex-col items-center gap-2 p-6 text-center text-sm text-ink-muted">
            <ImageOff className="size-6" aria-hidden="true" />
            Nu am putut încărca poza. Reîncarcă pagina și încearcă din nou.
          </p>
        ) : null}
        <img
          src={fileUrl(photo)}
          alt={photo.title}
          decoding="async"
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
          className={cn(
            // Încadrare: poza întreagă, fără decupare și fără deformare, pe orice ecran.
            "block h-auto max-h-[58dvh] w-auto max-w-full object-contain transition-opacity duration-300 sm:max-h-[68dvh]",
            state === "ready" ? "animate-fade-in opacity-100" : "opacity-0",
            state === "error" && "hidden",
          )}
        />
        {onPrev ? <NavButton side="left" onClick={onPrev} /> : null}
        {onNext ? <NavButton side="right" onClick={onNext} /> : null}
      </div>

      <div className="flex items-center gap-2">
        {total > 1 ? (
          <p className="tabular text-[13px] text-ink-muted" aria-live="polite">
            {position} din {total}
          </p>
        ) : null}
        <a href={fileUrl(photo)} target="_blank" rel="noopener" className={cn(buttonStyles({ variant: "secondary", size: "sm" }), "ml-auto")}>
          <ExternalLink aria-hidden="true" />
          Deschide originalul
        </a>
        <DeleteMaterial target={target} kind="image" />
      </div>
    </div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Poza anterioară" : "Poza următoare"}
      className={cn(
        "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-md backdrop-blur-sm transition-[background-color,transform] hover:bg-surface active:scale-95",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
