import { z } from "zod";
import { TASK_KINDS } from "./domain";
import { PROPOSAL_LIMITS } from "./proposals";
import { isDateKey, isTimeOfDay } from "@/lib/time/zone";

// Instrumentele pe care modelul le poate apela. Proprietar: David (implementare în src/features/assistant).
// Argumentele vin de la model, deci sunt NESIGURE: se validează cu aceste scheme și NU conțin user_id —
// identitatea vine mereu din sesiunea autentificată. Niciun instrument nu execută SQL sau cod arbitrar.
// Datele sunt locale (Europe/Bucharest): modelul dă „2026-10-23” + „18:00”, codul le transformă cu fromLocal().

const dateKey = z.string().refine(isDateKey, "Data trebuie să fie YYYY-MM-DD.");
const timeOfDay = z.string().refine(isTimeOfDay, "Ora trebuie să fie HH:MM.");
const subjectId = z.string().max(64).nullable();

export const AI_TOOL_ARGS = {
  /** Programul (activități + termene) pe câteva zile, începând cu o dată locală. */
  get_schedule: z.object({ from_date: dateKey, days: z.number().int().min(1).max(14) }),
  /** Teme și examene nefinalizate din următoarele N zile. */
  get_upcoming_deadlines: z.object({ days: z.number().int().min(1).max(60) }),
  /** Intervale libere calculate de cod (nu de model), în disponibilitatea studentului. */
  find_free_slots: z.object({
    from_date: dateKey,
    days: z.number().int().min(1).max(14),
    min_minutes: z.number().int().min(15).max(240),
  }),
  /** Notițe și text extras din materialele unei materii, cu număr de pagină. */
  get_subject_material: z.object({ subject_id: z.string().max(64), query: z.string().max(200).nullable() }),
  /** Temele la care studentul greșește în testele grilă recente (pe materie sau toate). */
  get_weak_topics: z.object({ subject_id: z.string().max(64).nullable() }),
  /** Pregătește teme/examene pentru salvare — NU salvează; creează o propunere 'pending'. */
  propose_task: z.object({
    explanation: z.string().max(600),
    items: z
      .array(
        z.object({
          kind: z.enum(TASK_KINDS),
          title: z.string().trim().min(1).max(160),
          subject_id: subjectId,
          date: dateKey,
          time: timeOfDay,
          notes: z.string().max(1000).nullable(),
        }),
      )
      .min(1)
      .max(PROPOSAL_LIMITS.maxTaskItems),
  }),
  /** Pregătește sesiuni de studiu — NU salvează; creează o propunere 'pending'. */
  propose_study_sessions: z.object({
    explanation: z.string().max(600),
    warnings: z.array(z.string().max(300)).max(5),
    fits_available_time: z.boolean(),
    items: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(160),
          subject_id: subjectId,
          date: dateKey,
          start: timeOfDay,
          end: timeOfDay,
          focus: z.string().max(300),
        }),
      )
      .min(1)
      .max(PROPOSAL_LIMITS.maxSessionItems),
  }),
} as const;

export type AiToolName = keyof typeof AI_TOOL_ARGS;

export const AI_LIMITS = {
  /** Câte runde de instrumente poate face modelul într-un singur răspuns. */
  maxToolSteps: 4,
  /** Interval maxim citit dintr-o dată. */
  maxScheduleDays: 14,
  /** Câte mesaje anterioare din conversație se trimit modelului. */
  maxHistoryMessages: 12,
  /** Câte caractere de material se trimit într-o cerere (~6k tokeni). */
  maxMaterialChars: 24_000,
  maxUserMessageChars: 4_000,
} as const;
