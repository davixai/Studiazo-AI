"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { THEME_COLOR, THEME_COOKIE, THEME_COOKIE_MAX_AGE, type Theme } from "@/lib/theme/theme";
import { cn } from "@/lib/utils";

/** Schimbă tema pe loc (cu o trecere lină a culorilor) și o ține minte în cookie. */
function applyTheme(next: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-changing");
  root.dataset.theme = next;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  window.setTimeout(() => root.classList.remove("theme-changing"), 500);
}

/** Comutatorul soare ↔ lună (Profil). */
export function ThemeSwitch({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const apply = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <label className="theme-switch">
      <input
        className="theme-switch__input"
        type="checkbox"
        role="switch"
        checked={theme === "dark"}
        onChange={(ev) => apply(ev.target.checked ? "dark" : "light")}
      />
      <span className="theme-switch__icon" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className={`theme-switch__icon-part theme-switch__icon-part--${i + 1}`} />
        ))}
      </span>
      <span className="sr-only">Temă întunecată</span>
    </label>
  );
}

const OPTIONS = [
  { value: "dark", label: "Întunecat", icon: Moon },
  { value: "light", label: "Luminos", icon: Sun },
] as const;

/** Pastilă segmentată Întunecat | Luminos (pagina Azi), cu indicator care alunecă între opțiuni. */
export function ThemeToggle({ initialTheme, className }: { initialTheme: Theme; className?: string }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const apply = (next: Theme) => {
    if (next === theme) return;
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Temă"
      // Ca la orice grup radio: săgețile comută între opțiuni.
      onKeyDown={(ev) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(ev.key)) return;
        ev.preventDefault();
        const next = theme === "dark" ? "light" : "dark";
        apply(next);
        ev.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`)?.focus();
      }}
      className={cn("relative grid grid-cols-2 rounded-full border border-line/70 bg-surface/60 p-0.5 backdrop-blur-sm", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-accent-soft shadow-xs ring-1 ring-accent-line transition-transform duration-300 ease-(--ease-out)",
          theme === "light" && "translate-x-full",
        )}
      />
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-value={value}
            onClick={() => apply(value)}
            className={cn(
              "relative inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-[3px] text-[12px] font-semibold transition-colors duration-200",
              active ? "text-accent-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className={cn("size-3.5", active && "fill-current")} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
