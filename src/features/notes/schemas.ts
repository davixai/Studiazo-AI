import { z } from "zod";
import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX, titleFromContent } from "./constants";

export * from "./constants";

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
