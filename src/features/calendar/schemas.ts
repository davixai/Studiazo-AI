import { z } from "zod";
import { EVENT_KINDS, RECURRENCE_KINDS, TASK_KINDS, type TaskKind } from "@/lib/contracts/domain";
import { isDateKey, isTimeOfDay } from "@/lib/time/zone";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} de caractere.`)
    .transform((v) => (v === "" ? null : v));

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

export const EventFormSchema = z
  .object({
    kind: z.enum(EVENT_KINDS, { error: "Alege tipul activității." }),
    title: z.string().trim().min(1, "Dă-i un nume activității.").max(160, "Maximum 160 de caractere."),
    subjectId: z.preprocess(emptyToNull, z.uuid("Materie invalidă.").nullable()),
    location: optionalText(160),
    notes: optionalText(4000),
    date: z.string().refine(isDateKey, "Alege data."),
    startTime: z.string().refine(isTimeOfDay, "Alege ora de început."),
    endTime: z.string().refine(isTimeOfDay, "Alege ora de sfârșit."),
    recurrence: z.enum(RECURRENCE_KINDS, { error: "Alege dacă se repetă." }),
    recurrenceUntil: z.preprocess(emptyToNull, z.string().refine(isDateKey, "Dată invalidă.").nullable()),
    /** „Salvează oricum” după avertismentul de suprapunere. */
    allowOverlap: z.preprocess((v) => v === "1", z.boolean()),
  })
  // Sfârșitul înaintea începutului = se termină a doua zi (localSpan); doar aceeași oră nu are sens.
  .refine((v) => v.endTime !== v.startTime, {
    path: ["endTime"],
    message: "Alege o oră de sfârșit diferită de cea de început.",
  })
  .refine((v) => v.recurrence === "none" || !v.recurrenceUntil || v.recurrenceUntil >= v.date, {
    path: ["recurrenceUntil"],
    message: "Data de final trebuie să fie după prima apariție.",
  })
  .transform((v) => ({ ...v, recurrenceUntil: v.recurrence === "none" ? null : v.recurrenceUntil }));

export type EventFormValues = z.infer<typeof EventFormSchema>;

/** Unde revine studentul după acțiune (vederea din calendar sau pagina Azi); validat în safeReturn(). */
const returnTo = z.string().max(120).optional();

export const DeleteEventSchema = z.discriminatedUnion("scope", [
  z.object({ id: z.uuid(), scope: z.literal("series"), returnTo }),
  z.object({ id: z.uuid(), scope: z.literal("occurrence"), date: z.string().refine(isDateKey), returnTo }),
]);

export const CompleteEventSchema = z.object({ id: z.uuid(), completed: z.boolean(), returnTo });

/** Doar căi interne cunoscute: /calendar sau /azi, cu parametri simpli. Orice altceva → /calendar. */
export function safeReturn(value: string | undefined) {
  return value && /^\/(calendar|azi)(\?[a-z]+=[\w-]+(&[a-z]+=[\w-]+)*)?$/.test(value) ? value : "/calendar";
}

/** Starea formularului de activitate. `warning` = se suprapune; studentul poate salva totuși. */
export type EventFormState = {
  status: "idle" | "error" | "warning";
  message?: string;
  fieldErrors?: Record<string, string>;
  conflicts?: string[];
  values?: Record<string, string>;
};

export const initialEventFormState: EventFormState = { status: "idle" };

export type ActionResult = { ok: true } | { ok: false; message: string };

const optionalMinutes = (min: number, max: number, message: string) =>
  z.preprocess(emptyToNull, z.coerce.number().int().min(min, message).max(max, message).nullable());

/** Teme, proiecte, examene: un termen (dată + oră) și, pentru probe, durata. */
export const TaskFormSchema = z.object({
  kind: z.enum(TASK_KINDS, { error: "Alege tipul." }),
  title: z.string().trim().min(1, "Scrie ce ai de predat sau de susținut.").max(160, "Maximum 160 de caractere."),
  subjectId: z.preprocess(emptyToNull, z.uuid("Materie invalidă.").nullable()),
  location: optionalText(160),
  notes: optionalText(4000),
  date: z.string().refine(isDateKey, "Alege data."),
  time: z.string().refine(isTimeOfDay, "Alege ora."),
  durationMinutes: optionalMinutes(5, 600, "Între 5 minute și 10 ore."),
  estimatedMinutes: optionalMinutes(5, 6000, "Între 5 minute și 100 de ore."),
});

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

/** Probele (examen, colocviu, test) au durată și loc; temele și proiectele au doar termen. */
export const TIMED_TASK_KINDS: readonly TaskKind[] = ["examen", "colocviu", "test"];

export const IdSchema = z.object({ id: z.uuid(), returnTo });
export const CompleteTaskSchema = z.object({ id: z.uuid(), completed: z.boolean(), returnTo });

export type TaskFormState = Omit<EventFormState, "conflicts" | "status"> & { status: "idle" | "error" };
export const initialTaskFormState: TaskFormState = { status: "idle" };
