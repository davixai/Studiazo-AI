"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { QUOTES } from "../quotes";

// Un citat motivațional ales la întâmplare la fiecare deschidere a paginii Azi (pe server, ca să nu „sară” la încărcare).
// Card-erou: chenar luminos care se rotește, aurora în fundal, citatul apare cuvânt cu cuvânt, lumina urmărește mouse-ul.

export function MotivationalQuote({ initialIndex }: { initialIndex: number }) {
  const [index, setIndex] = useState(initialIndex % QUOTES.length);
  const ref = useRef<HTMLElement>(null);
  const quote = QUOTES[index];
  const words = quote.text.split(" ");

  function next() {
    // Alt citat decât cel afișat.
    setIndex((i) => (i + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length);
  }

  function spotlight(e: React.PointerEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div className="quote-frame stagger rounded-xl p-px">
      <figure ref={ref} onPointerMove={spotlight} className="quote-card group/quote relative overflow-hidden rounded-[calc(var(--radius-xl)-1px)] px-5 py-6 sm:px-8 sm:py-8">
        {/* Fundal: lumini care plutesc, textură fină și spotul de sub cursor */}
        <span aria-hidden="true" className="quote-blob -top-24 -left-16 size-72 bg-accent/45" />
        <span aria-hidden="true" className="quote-blob -right-20 -bottom-28 size-80 bg-accent-blue/35 [animation-delay:-8s]" />
        <span aria-hidden="true" className="quote-blob top-1/3 left-1/2 size-56 bg-accent-pink/25 [animation-delay:-15s]" />
        <span aria-hidden="true" className="quote-grain" />
        <span aria-hidden="true" className="quote-spotlight" />
        <span aria-hidden="true" className="quote-stars" />

        {/* Ghilimele uriașe, decorative */}
        <span aria-hidden="true" className="quote-mark pointer-events-none absolute -top-4 left-2 font-quote text-[150px] leading-none select-none sm:-top-6 sm:left-4 sm:text-[210px]">
          “
        </span>

        <div className="relative flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] text-accent-ink uppercase backdrop-blur-sm">
              <Sparkles className="size-3.5 animate-[twinkle_2.6s_ease-in-out_infinite]" aria-hidden="true" />
              Gândul zilei
            </p>

            <blockquote key={index} className="mt-4 font-quote text-[22px] leading-[1.3] font-medium text-pretty text-white italic sm:mt-5 sm:text-[30px] sm:leading-[1.25]">
              {words.map((word, i) => (
                <span key={i} className="quote-word" style={{ "--w": i } as React.CSSProperties}>
                  {word}
                  {i < words.length - 1 ? " " : ""}
                </span>
              ))}
            </blockquote>

            <figcaption
              key={`a-${index}`}
              className="quote-author mt-4 flex items-center gap-3 text-[12px] font-semibold tracking-[0.16em] text-ink-soft uppercase sm:mt-5 sm:text-[13px]"
              style={{ "--w": words.length } as React.CSSProperties}
            >
              <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-brand sm:w-10" />
              {quote.author}
            </figcaption>
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Alt citat"
            title="Alt citat"
            className="group relative flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-ink-soft backdrop-blur-md transition-all duration-300 hover:border-accent-line hover:bg-accent/25 hover:text-white hover:shadow-accent"
          >
            <RefreshCw className="size-4 transition-transform duration-500 group-active:rotate-180" aria-hidden="true" />
          </button>
        </div>
      </figure>
    </div>
  );
}
