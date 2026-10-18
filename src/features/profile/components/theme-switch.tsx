"use client";

import { useState } from "react";
import { THEME_COLOR, THEME_COOKIE, THEME_COOKIE_MAX_AGE, type Theme } from "@/lib/theme/theme";

/** Comutatorul soare ↔ lună. Schimbă tema pe loc (cu o trecere lină a culorilor) și o ține minte în cookie. */
export function ThemeSwitch({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const apply = (next: Theme) => {
    setTheme(next);
    const root = document.documentElement;
    root.classList.add("theme-changing");
    root.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
    window.setTimeout(() => root.classList.remove("theme-changing"), 500);
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
