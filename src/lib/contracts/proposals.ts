import { z } from "zod";
import { TASK_KINDS } from "./domain";

// ─────────────────────────────────────────────────────────────
// Contractul propunerilor AI — formatul comun asistent ↔ calendar. Proprietar: David.
// Asistentul produce un payload valid și îl salvează în `ai_proposals` (status 'pending').
// Interfața afișează payload-ul, studentul confirmă, serverul revalidează și salvează.
// ─────────────────────────────────────────────────────────────

export const PROPOSAL_VERSION = 1;

export const PROPOSAL_LIMITS = {
  maxTaskItems: 5,
  maxSessionItems: 10,
  minSessionMinutes: 15,
  maxSessionMinutes: 240,
  /** Cât de departe în viitor poate fi planificat ceva. */
  horizonDays: 60,
  /** Toleranță pentru „în trecut” (latența dintre propunere și confirmare). */
  pastToleranceMinutes: 5,
} as const;

/** Moment ISO 8601 cu decalaj explicit, ex. 2026-10-23T10:00:00+03:00 */
const isoInstant = z.iso.datetime({ offset: true });
const shortText = (max: number) => z.string().trim().min(1).max(max);

export const TaskProposalItemSchema = z.object({
  kind: z.enum(TASK_KINDS),
  title: shortText(160),
  /** Trebuie să fie o materie a utilizatorului; verificat pe server la confirmare. */
  subjectId: z.uuid().nullable(),
  dueAt: isoInstant,
  notes: z.string().trim().max(1000).nullable(),
});

export const StudySessionItemSchema = z
  .object({
    title: shortText(160),
    subjectId: z.uuid().nullable(),
    startsAt: isoInstant,
    endsAt: isoInstant,
    /** Ce anume se studiază (capitol, tip de exerciții). */
    focus: z.string().trim().max(300),
  })
  .superRefine((item, ctx) => {
    const minutes = (Date.parse(item.endsAt) - Date.parse(item.startsAt)) / 60_000;
    if (!(minutes > 0)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Sesiunea trebuie să se termine după ce începe." });
    } else if (minutes < PROPOSAL_LIMITS.minSessionMinutes || minutes > PROPOSAL_LIMITS.maxSessionMinutes) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: `O sesiune trebuie să dureze între ${PROPOSAL_LIMITS.minSessionMinutes} și ${PROPOSAL_LIMITS.maxSessionMinutes} de minute.`,
      });
    }
  });

export const TaskProposalPayloadSchema = z.object({
  version: z.literal(PROPOSAL_VERSION),
  kind: z.literal("task"),
  items: z.array(TaskProposalItemSchema).min(1).max(PROPOSAL_LIMITS.maxTaskItems),
  /** Explicație scurtă afișată studentului. */
  explanation: z.string().trim().max(600),
});

export const StudySessionsPayloadSchema = z.object({
  version: z.literal(PROPOSAL_VERSION),
  kind: z.literal("study_sessions"),
  items: z.array(StudySessionItemSchema).min(1).max(PROPOSAL_LIMITS.maxSessionItems),
  explanation: z.string().trim().max(600),
  /** Avertismente pentru student, ex. „Obiectivul nu încape realist până vineri.” */
  warnings: z.array(z.string().trim().max(300)).max(5),
  /** false când materialul nu încape realist în timpul disponibil. */
  fitsAvailableTime: z.boolean(),
});

export const ProposalPayloadSchema = z.discriminatedUnion("kind", [
  TaskProposalPayloadSchema,
  StudySessionsPayloadSchema,
]);

export type TaskProposalItem = z.infer<typeof TaskProposalItemSchema>;
export type StudySessionItem = z.infer<typeof StudySessionItemSchema>;
export type TaskProposalPayload = z.infer<typeof TaskProposalPayloadSchema>;
export type StudySessionsPayload = z.infer<typeof StudySessionsPayloadSchema>;
export type ProposalPayload = z.infer<typeof ProposalPayloadSchema>;

export type ProposalStatus = "pending" | "confirmed" | "rejected" | "expired";

/** O propunere așa cum o citește interfața din `ai_proposals`. */
export type Proposal = {
  id: string;
  conversationId: string | null;
  status: ProposalStatus;
  payload: ProposalPayload;
  createdAt: string;
  expiresAt: string;
};

/** Rezultatul acțiunii de confirmare (implementată de David în src/features/proposals). */
export type ConfirmProposalResult =
  | { ok: true; alreadyConfirmed: boolean; createdEventIds: string[]; createdTaskIds: string[] }
  | {
      ok: false;
      code: "unauthenticated" | "not_found" | "expired" | "not_pending" | "invalid" | "conflict" | "error";
      message: string;
      /** Pentru `conflict`: ce se suprapune, ca studentul să poată alege altceva. */
      conflicts?: Array<{ itemIndex: number; title: string; start: string; end: string }>;
    };

export type TimingIssue = { itemIndex: number; message: string };

/**
 * Verificări temporale pentru o propunere deja validată de schemă.
 * Se rulează și când se creează propunerea, și la confirmare.
 */
export function checkProposalTiming(payload: ProposalPayload, now = new Date()): TimingIssue[] {
  const earliest = now.getTime() - PROPOSAL_LIMITS.pastToleranceMinutes * 60_000;
  const latest = now.getTime() + PROPOSAL_LIMITS.horizonDays * 86_400_000;
  const issues: TimingIssue[] = [];

  payload.items.forEach((item, itemIndex) => {
    const at = Date.parse("startsAt" in item ? item.startsAt : item.dueAt);
    if (at < earliest) issues.push({ itemIndex, message: "Data este în trecut." });
    else if (at > latest) issues.push({ itemIndex, message: `Data este la mai mult de ${PROPOSAL_LIMITS.horizonDays} de zile.` });
  });

  return issues;
}
