// Tema aplicației: întunecată (implicit) sau deschisă. Alegerea stă într-un cookie, ca serverul
// să trimită pagina direct în tema bună (fără „flash” la încărcare).

export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "theme";
/** Un an. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Culoarea barei browserului pe telefon (aceeași cu fundalul paginii). */
export const THEME_COLOR: Record<Theme, string> = { dark: "#080b1a", light: "#f4f5fb" };

export function parseTheme(value: string | undefined | null): Theme {
  return value === "light" ? "light" : "dark";
}
