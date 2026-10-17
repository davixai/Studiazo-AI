"use client";

import { Quote, RefreshCw } from "lucide-react";
import { useState } from "react";
import { QUOTES } from "../quotes";

// Un citat motivațional ales la întâmplare la fiecare deschidere a paginii Azi (pe server, ca să nu „sară” la încărcare).

export function MotivationalQuote({ initialIndex }: { initialIndex: number }) {
  const [index, setIndex] = useState(initialIndex % QUOTES.length);
  const quote = QUOTES[index];

  function next() {
    // Alt citat decât cel afișat.
    setIndex((i) => (i + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length);
  }

  return (
    <figure className="stagger relative flex items-start gap-4 overflow-hidden rounded-lg border border-line/70 bg-surface p-4 shadow-sm sm:p-5">
      <span aria-hidden="true" className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full bg-accent/15 blur-3xl" />
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-md bg-brand text-white shadow-accent" aria-hidden="true">
        <Quote className="size-5" />
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-ink-faint uppercase">Gândul zilei</p>
        <blockquote key={index} className="animate-rise-in mt-1 text-[15px] leading-6 font-semibold text-pretty text-ink sm:text-[16px]">
          „{quote.text}”
        </blockquote>
        <figcaption key={`a-${index}`} className="animate-fade-in mt-1 text-[13px] text-ink-muted">
          — {quote.author}
        </figcaption>
      </div>
      <button
        type="button"
        onClick={next}
        aria-label="Alt citat"
        title="Alt citat"
        className="group relative flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
      >
        <RefreshCw className="size-4 transition-transform duration-500 group-active:rotate-180" aria-hidden="true" />
      </button>
    </figure>
  );
}
