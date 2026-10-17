"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOccurrencesBetween } from "@/features/calendar/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { ProposalPayloadSchema, type ConfirmProposalResult } from "@/lib/contracts/proposals";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { planConfirmation, sessionsRange, type ProposalRow } from "./plan";

const PREVIEW_MESSAGE = "Modul previzualizare nu salvează date. Conectează Supabase pentru a confirma propunerea.";
const UNIQUE_VIOLATION = "23505";

type CreatedIds = { createdEventIds: string[]; createdTaskIds: string[] };

/**
 * Salvează în calendar o propunere a asistentului, numai după „Confirmă”.
 * Nu primește conținut de la client: citește propunerea din DB (RLS), o revalidează, verifică suprapunerile
 * cu programul de acum și inserează cu (proposal_id, proposal_item_index) — indexul unic împiedică dublurile.
 * A doua apăsare (sau o reîncercare) întoarce alreadyConfirmed, fără inserări noi.
 */
export async function confirmProposal(id: unknown): Promise<ConfirmProposalResult> {
  if (isPreviewMode()) return { ok: false, code: "error", message: PREVIEW_MESSAGE };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated", message: "Autentifică-te din nou." };

  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return { ok: false, code: "not_found", message: "Propunerea nu există." };
  const proposalId = parsedId.data;

  const supabase = await createClient();
  const { data: row, error: readError } = await supabase
    .from("ai_proposals")
    .select("id, status, payload, expires_at")
    .eq("id", proposalId)
    .maybeSingle<ProposalRow>();
  if (readError) return { ok: false, code: "error", message: "Nu am putut citi propunerea. Încearcă din nou." };
  if (!row) return { ok: false, code: "not_found", message: "Propunerea nu există." };

  if (row.status === "confirmed") return { ok: true, alreadyConfirmed: true, ...(await createdIds(proposalId)) };

  const range = sessionsRange(row.payload);
  const busy = range
    ? (await getOccurrencesBetween(range)).map((o) => ({ start: o.start, end: o.end, title: o.event.title }))
    : [];
  const plan = planConfirmation({ row, now: new Date(), busy, ownedSubjectIds: await ownedSubjects(row.payload) });

  if (!plan.ok) {
    if (plan.code === "expired" && row.status === "pending") await resolve(proposalId, "expired");
    return plan;
  }

  const insert = plan.events.length > 0
    ? await supabase.from("events").insert(plan.events).select("id")
    : await supabase.from("tasks").insert(plan.tasks).select("id");

  // Altă cerere a salvat deja aceleași elemente (dublu-click, două taburi): nu dublăm nimic.
  const alreadyConfirmed = insert.error?.code === UNIQUE_VIOLATION;
  if (insert.error && !alreadyConfirmed) {
    return { ok: false, code: "error", message: "Nu am putut salva în calendar. Încearcă din nou." };
  }

  await resolve(proposalId, "confirmed");
  revalidatePath("/calendar");
  revalidatePath("/azi");

  if (alreadyConfirmed) return { ok: true, alreadyConfirmed: true, ...(await createdIds(proposalId)) };
  const ids = (insert.data ?? []).map((r) => r.id as string);
  return {
    ok: true,
    alreadyConfirmed: false,
    createdEventIds: plan.events.length > 0 ? ids : [],
    createdTaskIds: plan.tasks.length > 0 ? ids : [],
  };
}

/** „Renunță”: propunerea rămâne în istoric ca respinsă; nimic nu ajunge în calendar. */
export async function rejectProposal(id: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isPreviewMode()) return { ok: false, message: PREVIEW_MESSAGE };
  if (!(await getCurrentUser())) return { ok: false, message: "Autentifică-te din nou." };

  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return { ok: false, message: "Propunerea nu există." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_proposals")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .eq("status", "pending")
    .select("id");
  if (error) return { ok: false, message: "Nu am putut renunța la propunere. Încearcă din nou." };
  if (!data?.length) return { ok: false, message: "Propunerea nu mai așteaptă confirmare." };
  return { ok: true };
}

/** Trecerea din pending e unică: dacă altă cerere a schimbat deja statusul, nu o suprascriem. */
async function resolve(proposalId: string, status: "confirmed" | "expired") {
  const supabase = await createClient();
  await supabase
    .from("ai_proposals")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("status", "pending");
}

async function createdIds(proposalId: string): Promise<CreatedIds> {
  const supabase = await createClient();
  const [events, tasks] = await Promise.all([
    supabase.from("events").select("id").eq("proposal_id", proposalId),
    supabase.from("tasks").select("id").eq("proposal_id", proposalId),
  ]);
  return {
    createdEventIds: (events.data ?? []).map((r) => r.id as string),
    createdTaskIds: (tasks.data ?? []).map((r) => r.id as string),
  };
}

/** Materiile din propunere care chiar sunt ale utilizatorului (RLS filtrează restul). */
async function ownedSubjects(payload: unknown): Promise<Set<string>> {
  const parsed = ProposalPayloadSchema.safeParse(payload);
  if (!parsed.success) return new Set();
  const ids = [...new Set(parsed.data.items.map((i) => i.subjectId).filter((v): v is string => v !== null))];
  if (ids.length === 0) return new Set();

  const supabase = await createClient();
  const { data } = await supabase.from("subjects").select("id").in("id", ids);
  return new Set((data ?? []).map((r) => r.id as string));
}
