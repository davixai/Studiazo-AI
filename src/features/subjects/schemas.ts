import { z } from "zod";
import { SUBJECT_COLORS } from "@/lib/contracts/domain";
import { SUBJECT_NAME_MAX } from "./constants";

export * from "./constants";

export const SubjectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Scrie numele materiei.")
    .max(SUBJECT_NAME_MAX, `Numele poate avea cel mult ${SUBJECT_NAME_MAX} de caractere.`),
  professor: z
    .string()
    .trim()
    .max(120, "Numele profesorului poate avea cel mult 120 de caractere.")
    .transform((v) => (v === "" ? null : v)),
  color: z.enum(SUBJECT_COLORS, "Alege o culoare."),
});

export type SubjectFormValues = z.infer<typeof SubjectFormSchema>;

/** Id-ul unei materii primit din formular sau din URL (validat înainte de orice interogare). */
export const SubjectIdSchema = z.uuid();
