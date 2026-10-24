// Fără zod: componentele de client importă de aici, ca biblioteca să nu ajungă în browser.

// Limitele oglindesc constrângerile din tabelul `notes` (title 1–160, content ≤ 50.000).
// `.length` numără unități UTF-16, deci un emoji contează dublu: limita din aplicație e cel mult la fel de strictă ca în DB.
export const NOTE_TITLE_MAX = 160;
export const NOTE_CONTENT_MAX = 50_000;

/** Primul rând cu text din conținut, scurtat la o lungime potrivită pentru un titlu. */
export function titleFromContent(content: string, max = 60) {
  const line = content.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  if (line.length <= max) return line;
  const cut = line.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
