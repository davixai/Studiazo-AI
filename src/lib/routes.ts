/** Pagini de autentificare: un utilizator conectat este trimis la /azi. */
const AUTH_ROUTES = ["/autentificare", "/inregistrare", "/recuperare"];

/** Rute accesibile fără cont. */
const PUBLIC_PREFIXES = [...AUTH_ROUTES, "/auth/", "/resetare-parola", "/manifest.webmanifest", "/icons/"];

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.includes(pathname);
}

export function isPublicRoute(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Acceptă doar căi relative interne pentru `?next=` (previne redirecționări către alte site-uri). */
export function safeNextPath(value: unknown, fallback = "/azi") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
