import { z } from "zod";

// Instrumentele pe care modelul le poate apela. Proprietar: Sergiu (implementare în src/features/assistant).
// Argumentele vin de la model, deci sunt NESIGURE: se validează cu aceste scheme și NU conțin user_id —
// identitatea vine mereu din sesiunea autentificată. Niciun instrument nu execută SQL sau cod arbitrar.

const isoInstant = z.iso.datetime({ offset: true });

export const AI_TOOL_ARGS = {
  /** Citește programul (activități + termene) dintr-un interval de maximum 14 zile. */
  get_schedule: z.object({ from: isoInstant, to: isoInstant }),
  /** Teme și examene nefinalizate din următoarele N zile. */
  get_upcoming_deadlines: z.object({ days: z.number().int().min(1).max(60) }),
  /** Intervale libere calculate de cod (nu de model) dintr-un interval. */
  find_free_slots: z.object({
    from: isoInstant,
    to: isoInstant,
    minMinutes: z.number().int().min(15).max(240),
  }),
  /** Notițe și text extras din materia selectată, cu număr de pagină. */
  get_subject_material: z.object({
    subjectId: z.uuid(),
    query: z.string().max(200).nullable(),
  }),
  /** Pregătește o temă/un examen pentru salvare — NU salvează; creează o propunere 'pending'. */
  propose_task: z.object({ proposal: z.unknown() }),
  /** Pregătește sesiuni de studiu — NU salvează; creează o propunere 'pending'. */
  propose_study_sessions: z.object({ proposal: z.unknown() }),
  /** Generează un test scurt din materialul selectat. */
  generate_quiz: z.object({
    subjectId: z.uuid(),
    materialIds: z.array(z.uuid()).max(5),
    questionCount: z.number().int().min(3).max(10),
  }),
} as const;

export type AiToolName = keyof typeof AI_TOOL_ARGS;

export const AI_LIMITS = {
  /** Câte apeluri de instrumente poate face modelul într-un singur răspuns. */
  maxToolSteps: 4,
  /** Interval maxim citit dintr-o dată. */
  maxScheduleDays: 14,
  /** Câte mesaje anterioare din conversație se trimit modelului. */
  maxHistoryMessages: 12,
  /** Câte caractere de material se trimit într-o cerere (~6k tokeni). */
  maxMaterialChars: 24_000,
  maxUserMessageChars: 4_000,
} as const;
