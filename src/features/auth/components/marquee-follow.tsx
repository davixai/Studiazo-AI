"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Când cursorul e deasupra benzii, banda (oprită din alunecare) îl urmărește lin pe orizontală, iar cardul
// de sub cursor se înclină ușor spre el. La ieșire, totul revine lin și banda își reia mișcarea normală.
// Doar cu mouse; fără efect cu prefers-reduced-motion.

const RANGE = 140; // px, cât se poate deplasa banda în fiecare parte

export function MarqueeFollow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let target = 0;
    let current = 0;
    let frame = 0;
    let tilted: HTMLElement | null = null;

    const tick = () => {
      current += (target - current) * 0.12;
      el.style.transform = `translate3d(${current.toFixed(2)}px, 0, 0)`;
      frame = Math.abs(target - current) > 0.2 ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const untilt = () => {
      tilted?.style.removeProperty("--rx");
      tilted?.style.removeProperty("--ry");
      tilted = null;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const box = el.parentElement!.getBoundingClientRect();
      target = ((e.clientX - box.left) / box.width - 0.5) * 2 * RANGE;
      run();

      const card = e.target instanceof Element ? (e.target.closest(".marquee-card") as HTMLElement | null) : null;
      if (card !== tilted) untilt();
      if (card) {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
        tilted = card;
      }
    };
    const onLeave = () => {
      target = 0;
      untilt();
      run();
    };

    const area = el.parentElement!;
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="will-change-transform">
      {children}
    </div>
  );
}
