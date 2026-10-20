"use client";

import { RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { QUOTES } from "../quotes";

// Un citat motivațional ales la întâmplare la fiecare deschidere a paginii Azi (pe server, ca să nu „sară” la încărcare).
// Card editorial pe tokenii site-ului (merge și pe tema deschisă): lumină discretă în colț,
// citatul apare cuvânt cu cuvânt, iar lumina urmărește mouse-ul.

export function MotivationalQuote({ initialIndex }: { initialIndex: number }) {
  const [index, setIndex] = useState(initialIndex % QUOTES.length);
  const [spin, setSpin] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const quote = QUOTES[index];
  const words = quote.text.split(" ");

  function next() {
    // Alt citat decât cel afișat.
    setIndex((i) => (i + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length);
    setSpin((s) => s + 1);
  }

  function spotlight(e: React.PointerEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    // @container: fonturile și spațierile se adaptează la lățimea cardului (îngust lângă salut, lat pe tabletă).
    <figure
      ref={ref}
      onPointerMove={spotlight}
      className="quote-card stagger @container relative isolate h-full overflow-hidden rounded-xl border border-line/70 bg-surface shadow-sm"
    >
      <span aria-hidden="true" className="quote-glow" />
      <span aria-hidden="true" className="quote-dots" />
      <span aria-hidden="true" className="quote-spotlight" />

      <div className="relative flex h-full flex-col gap-4 px-5 py-5 @xl:px-7 @xl:py-6">
        <p className="inline-flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.14em] text-ink-muted uppercase">
          <span aria-hidden="true" className="icon-badge flex size-8 items-center justify-center rounded-md bg-accent-soft text-[17px] leading-none ring-1 ring-accent-line/60">
            📚
          </span>
          Gândul zilei
        </p>

        <blockquote
          key={index}
          className="quote-text flex-1 font-quote text-[19px] leading-[1.42] font-normal tracking-[-0.012em] text-pretty break-words text-ink italic @md:text-[21px] @2xl:text-[24px] @2xl:leading-[1.36]"
        >
          {words.map((word, i) => (
            <span key={i} className="quote-word" style={{ "--w": i } as React.CSSProperties}>
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </blockquote>

        {/* Autorul ca semnătură, butonul pentru alt citat în dreapta */}
        <div className="flex items-center justify-between gap-3">
          <figcaption
            key={`a-${index}`}
            className="quote-author flex min-w-0 items-baseline gap-2 text-[14px] font-semibold tracking-[-0.01em] text-ink-soft @2xl:text-[15px]"
            style={{ "--w": words.length } as React.CSSProperties}
          >
            <span aria-hidden="true" className="text-accent-ink">—</span>
            <span className="truncate">{quote.author}</span>
          </figcaption>

          <button
            type="button"
            onClick={next}
            aria-label="Alt citat"
            title="Alt citat"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line/70 bg-surface-muted/60 text-ink-muted transition-colors duration-200 hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink"
          >
            <RefreshCw
              className="size-4"
              style={{ transform: `rotate(${spin * 180}deg)`, transition: "transform 600ms var(--ease-spring)" }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </figure>
  );
}
