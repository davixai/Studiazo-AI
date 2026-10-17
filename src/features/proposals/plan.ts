import {
  ProposalPayloadSchema,
  checkProposalTiming,
  type ConfirmProposalResult,
  type ProposalPayload,
} from "@/lib/contracts/proposals";
import { findConflicts, findInternalOverlaps, type BusyInterval } from "@/lib/time/slots";
import { APP_TIMEZONE } from "@/lib/time/zone";

// Logica pură a confirmării: din propunerea citită din DB + programul actual → rândurile de inserat
// sau motivul refuzului. Fără acces la rețea, ca să poată fi testată complet.

export type ProposalRow = { id: string; status: string; payload: unknown; expires_at: string };

type Failure = Extract<ConfirmProposalResult, { ok: false }>;

export type ConfirmationPlan =
  | { ok: true; payload: ProposalPayload; events: Record<string, unknown>[]; tasks: Record<string, unknown>[] }
  | Failure;

type PlanInput = {
  row: ProposalRow;
  now: Date;
  /** Activitățile existente în intervalul propunerii (pentru suprapuneri). */
  busy: BusyInterval[];
  /** Materiile utilizatorului; o materie necunoscută (ștearsă între timp) devine „fără materie”. */
  ownedSubjectIds: Set<string>;
};

export function planConfirmation({ row, now, busy, ownedSubjectIds }: PlanInput): ConfirmationPlan {
  if (row.status === "expired" || Date.parse(row.expires_at) <= now.getTime()) {
    return { ok: false, code: "expired", message: "Propunerea a expirat. Cere asistentului una nouă." };
  }
  if (row.status !== "pending") {
    return { ok: false, code: "not_pending", message: "Propunerea nu mai așteaptă confirmare." };
  }

  const parsed = ProposalPayloadSchema.safeParse(row.payload);
  if (!parsed.success) return { ok: false, code: "invalid", message: "Propunerea nu este validă. Cere asistentului una nouă." };
  const payload = parsed.data;

  const timing = checkProposalTiming(payload, now);
  if (timing.length > 0) {
    return { ok: false, code: "invalid", message: `${timing[0].message} Cere asistentului o propunere nouă.` };
  }

  const subject = (id: string | null) => (id && ownedSubjectIds.has(id) ? id : null);
  const link = (index: number) => ({ proposal_id: row.id, proposal_item_index: index });

  if (payload.kind === "task") {
    const tasks = payload.items.map((item, index) => ({
      kind: item.kind,
      title: item.title,
      subject_id: subject(item.subjectId),
      due_at: new Date(item.dueAt).toISOString(),
      notes: item.notes,
      ...link(index),
    }));
    return { ok: true, payload, events: [], tasks };
  }

  const sessions = payload.items.map((item, itemIndex) => ({
    itemIndex,
    title: item.title,
    start: new Date(item.startsAt),
    end: new Date(item.endsAt),
  }));

  const internal = findInternalOverlaps(sessions);
  if (internal.length > 0) {
    return { ok: false, code: "invalid", message: "Două sesiuni din propunere se suprapun. Cere asistentului una nouă." };
  }

  const conflicts = sessions.flatMap((session) =>
    findConflicts(session, busy).map((other) => ({
      itemIndex: session.itemIndex,
      title: other.title ?? "Altă activitate",
      start: other.start.toISOString(),
      end: other.end.toISOString(),
    })),
  );
  if (conflicts.length > 0) {
    return {
      ok: false,
      code: "conflict",
      message: "Între timp ai adăugat ceva în aceleași intervale. Cere asistentului alte ore.",
      conflicts,
    };
  }

  const events = payload.items.map((item, index) => ({
    kind: "studiu",
    title: item.title,
    subject_id: subject(item.subjectId),
    starts_at: new Date(item.startsAt).toISOString(),
    ends_at: new Date(item.endsAt).toISOString(),
    timezone: APP_TIMEZONE,
    recurrence: "none",
    notes: item.focus || null,
    ...link(index),
  }));
  return { ok: true, payload, events, tasks: [] };
}

/** Intervalul acoperit de sesiunile propuse (pentru a citi doar programul relevant). */
export function sessionsRange(payload: unknown): { start: Date; end: Date } | null {
  const parsed = ProposalPayloadSchema.safeParse(payload);
  if (!parsed.success || parsed.data.kind !== "study_sessions") return null;
  const starts = parsed.data.items.map((i) => Date.parse(i.startsAt));
  const ends = parsed.data.items.map((i) => Date.parse(i.endsAt));
  return { start: new Date(Math.min(...starts)), end: new Date(Math.max(...ends)) };
}
