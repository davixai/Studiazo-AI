import { z } from "zod";

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

/** Titlul e opțional în formular: dacă lipsește, îl luăm din primul rând al notiței. */
export const NoteFormSchema = z
  .object({
    title: z.string().trim().max(NOTE_TITLE_MAX, `Titlul poate avea cel mult ${NOTE_TITLE_MAX} de caractere.`),
    content: z
      .string()
      .max(NOTE_CONTENT_MAX, "Notița poate avea cel mult 50.000 de caractere. Împarte-o în două.")
      .transform((v) => v.replace(/\s+$/, "")),
  })
  .transform((v) => ({ title: v.title || titleFromContent(v.content), content: v.content }))
  .refine((v) => v.title.length > 0, { path: ["content"], message: "Scrie un titlu sau câteva rânduri în notiță." });

export type NoteFormValues = z.infer<typeof NoteFormSchema>;

export const NoteIdSchema = z.uuid();
