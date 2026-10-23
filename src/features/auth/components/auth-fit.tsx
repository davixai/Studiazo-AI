"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

// Pe calculator, paginile de autentificare trebuie să încapă pe ecran fără derulare. Dacă ecranul e mai jos
// decât pagina, o micșorăm toată, uniform (zoom), ca la Ctrl+minus: textele, cardurile și spațiile își păstrează
// proporțiile. Pe telefon (sub lg) pagina se derulează normal.

const DESKTOP = "(min-width: 1024px)";
const MIN_SCALE = 0.6; // sub atât textul devine greu de citit; mai bine apare derularea

export function AuthFit({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const desktop = window.matchMedia(DESKTOP);
    let frame = 0;

    const fit = () => {
      frame = 0;
      if (!desktop.matches) {
        el.style.removeProperty("zoom");
        el.style.removeProperty("min-height");
        return;
      }
      // Înălțimea naturală, fără zoom și fără înălțimea minimă (citire sincronă, nu ajunge pe ecran).
      el.style.zoom = "1";
      el.style.minHeight = "0";
      // Un pixel de rezervă: rotunjirile zoomului altfel pot lăsa o derulare de 1px.
      const height = window.innerHeight - 1;
      const scale = Math.max(MIN_SCALE, Math.min(1, height / el.offsetHeight));
      el.style.zoom = String(scale);
      // Valorile în px se înmulțesc cu zoomul, așa că împărțim ca pagina să umple ecranul.
      el.style.minHeight = `${height / scale}px`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(fit);
    };

    fit();
    window.addEventListener("resize", schedule);
    desktop.addEventListener("change", schedule);
    document.fonts?.ready.then(schedule);
    // Se schimbă conținutul (altă pagină de autentificare, un mesaj de eroare): recalculăm.
    const observer = new MutationObserver(schedule);
    observer.observe(el, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      desktop.removeEventListener("change", schedule);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
