"use client";

import { useEffect, useRef } from "react";

// O lumină foarte discretă care urmărește lin cursorul (doar mouse; oprită cu prefers-reduced-motion, vezi globals.css).
// Cursorul nativ rămâne neschimbat; lumina nu primește clicuri. Bucla rAF rulează doar cât se mișcă.

export function CursorEffects() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: -500, y: -500 };
    const pos = { ...target };
    let frame = 0;

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      glow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const settled = Math.abs(target.x - pos.x) < 0.3 && Math.abs(target.y - pos.y) < 0.3;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      // Prima mișcare: lumina pornește direct de sub cursor, fără să „zboare” din colț.
      if (target.x < -400) Object.assign(pos, { x: e.clientX, y: e.clientY });
      target.x = e.clientX;
      target.y = e.clientY;
      document.documentElement.dataset.cursor = "on";
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      document.documentElement.dataset.cursor = "off";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      delete document.documentElement.dataset.cursor;
    };
  }, []);

  return <div ref={glowRef} aria-hidden="true" className="cursor-glow" />;
}
