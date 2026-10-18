"use server";

import { randomUUID } from "node:crypto";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile, getStudyProfile } from "@/features/profile/queries";
import { listSubjects } from "@/features/subjects/queries";
import { describeAiError } from "@/lib/ai/client";
import { getAiConfig } from "@/lib/ai/config";
import { requireUser } from "@/lib/auth/session";
import { AI_LIMITS } from "@/lib/contracts/ai-tools";
import type { Proposal } from "@/lib/contracts/proposals";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PROPOSAL_COLUMNS, toProposal } from "@/lib/supabase/mappers";
import { runAssistant } from "./engine";
import { buildInstructions } from "./prompt";
import { imagePathOf, toChatMessage, type ChatMessage } from "./queries";
import { executeTool } from "./tools";

/** Poză redimensionată în browser (JPEG/PNG/WebP), ca data URL; limita de 1 MB a Server Actions o acoperă. */
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_CHARS = 900_000;

const SendSchema = z.object({
  subjectId: z.uuid().nullable(),
  /** Conversația deschisă; null = ultima conversație a chatului sau, cu newConversation, una nouă. */
  conversationId: z.uuid().nullable().default(null),
  newConversation: z.boolean().default(false),
  text: z.string().trim().max(AI_LIMITS.maxUserMessageChars, "Mesajul e prea lung."),
  image: z.string().max(MAX_IMAGE_CHARS, "Poza e prea mare.").regex(IMAGE_DATA_URL, "Poza nu este validă.").nullable(),
});

export type SendResult =
  | { ok: true; conversationId: string; messages: ChatMessage[]; proposals: Proposal[] }
  | { ok: false; message: string; retryable: boolean };

/**
 * Trimite un mesaj în chatul unei materii (sau în cel general) și întoarce răspunsul asistentului.
 * Mesajele se salvează doar după un răspuns reușit; la eroare, textul rămâne în compozitor.
 */
export async function sendMessage(input: unknown): Promise<SendResult> {
  if (isPreviewMode()) {
    return { ok: false, message: "Modul previzualizare nu folosește asistentul. Conectează Supabase și cheia OpenAI.", retryable: false };
  }
  const user = await requireUser();
  const parsed = SendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Mesaj invalid.", retryable: false };
  const { subjectId, text, image, conversationId: requestedConversation, newConversation } = parsed.data;
  if (!text && !image) return { ok: false, message: "Scrie o întrebare sau atașează o poză.", retryable: false };

  const config = getAiConfig();
  if (!config.enabled) return { ok: false, message: "Asistentul AI nu este disponibil momentan.", retryable: false };

  const supabase = await createClient();
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", hourAgo);
  if ((count ?? 0) >= config.requestsPerHour) {
    return { ok: false, message: "Ai trimis multe întrebări în ultima oră. Mai încearcă puțin mai târziu.", retryable: false };
  }

  const [profile, study, subjects] = await Promise.all([getProfile(), getStudyProfile(), listSubjects()]);
  const subject = subjectId ? (subjects.find((s) => s.id === subjectId) ?? null) : null;
  if (subjectId && !subject) return { ok: false, message: "Materia nu mai există.", retryable: false };

  const conversation = await resolveConversation({ subjectId, requested: requestedConversation, newConversation, title: text || subject?.name || "Poză" });
  if (!conversation.ok) return { ok: false, message: conversation.message, retryable: conversation.retryable };
  const conversationId = conversation.id;

  const { data: historyRows } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(AI_LIMITS.maxHistoryMessages);
  const history: ResponseInputItem[] = (historyRows ?? [])
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string }));

  const question = text || "Ce vezi în poză? Ajută-mă cu ea.";
  const current: ResponseInputItem = image
    ? {
        role: "user",
        content: [
          { type: "input_text", text: question },
          { type: "input_image", image_url: image, detail: "auto" },
        ],
      }
    : { role: "user", content: question };

  const now = new Date();
  let turn;
  try {
    turn = await runAssistant({
      instructions: buildInstructions({ now, profile, study, subjects, subject }),
      input: [...history, current],
      userId: user.id,
      execute: (name, args) => executeTool(name, args, { now, profile, subjects, subjectId, conversationId }),
    });
  } catch (error) {
    const described = describeAiError(error);
    await supabase.from("ai_usage").insert({ kind: "chat", model: config.model, ok: false });
    return { ok: false, message: described.message, retryable: described.retryable };
  }

  await supabase.from("ai_usage").insert({
    kind: "chat",
    model: config.model,
    input_tokens: turn.usage.inputTokens,
    output_tokens: turn.usage.outputTokens,
  });

  // Poza rămâne în istoric: o păstrăm privat în Storage. Dacă nu reușim, mesajul se salvează oricum, fără ea.
  const imagePath = image ? await storeChatImage(user.id, image) : null;

  // Ore explicite: ambele rânduri se inserează în aceeași tranzacție și ar avea același now().
  const answeredAt = Date.now();
  const { data: saved, error } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        role: "user",
        content: question,
        metadata: image ? { image: true, ...(imagePath ? { imagePath } : {}) } : {},
        created_at: new Date(answeredAt - 1).toISOString(),
      },
      {
        conversation_id: conversationId,
        role: "assistant",
        created_at: new Date(answeredAt).toISOString(),
        content: turn.text.slice(0, 20_000),
        metadata: { proposalIds: turn.proposalIds, citations: turn.citations },
      },
    ])
    .select("id, role, content, metadata, created_at");
  if (error) return { ok: false, message: "Nu am putut salva conversația. Încearcă din nou.", retryable: true };
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  const proposals = turn.proposalIds.length
    ? ((await supabase.from("ai_proposals").select(PROPOSAL_COLUMNS).in("id", turn.proposalIds)).data ?? [])
        .map(toProposal)
        .filter((p): p is Proposal => p !== null)
    : [];

  return {
    ok: true,
    conversationId,
    messages: (saved ?? []).map((r) => toChatMessage(r)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    proposals,
  };
}

/** Șterge o conversație din istoric, cu mesajele și pozele ei. Propunerile deja salvate rămân în calendar. */
export async function deleteConversation(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isPreviewMode()) return { ok: false, message: "Modul previzualizare nu salvează date." };
  await requireUser();
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Conversația nu există." };

  const supabase = await createClient();
  const { data: rows } = await supabase.from("messages").select("metadata").eq("conversation_id", parsed.data.id);
  const paths = (rows ?? []).map((r) => imagePathOf(r.metadata)).filter((p): p is string => p !== null);
  if (paths.length > 0) await supabase.storage.from("materials").remove(paths);

  const { error } = await supabase.from("conversations").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, message: "Nu am putut șterge conversația. Încearcă din nou." };
  revalidatePath("/asistent");
  return { ok: true };
}

type ResolvedConversation = { ok: true; id: string } | { ok: false; message: string; retryable: boolean };

/** Conversația în care scriem: cea deschisă (verificată că e a acestui chat), una nouă sau ultima. */
async function resolveConversation({
  subjectId,
  requested,
  newConversation,
  title,
}: {
  subjectId: string | null;
  requested: string | null;
  newConversation: boolean;
  title: string;
}): Promise<ResolvedConversation> {
  const supabase = await createClient();
  if (requested) {
    const { data } = await supabase.from("conversations").select("id, subject_id").eq("id", requested).maybeSingle();
    if (!data || (data.subject_id ?? null) !== subjectId) {
      return { ok: false, message: "Conversația nu mai există. Deschide-o din nou din istoric.", retryable: false };
    }
    return { ok: true, id: data.id as string };
  }
  if (!newConversation) {
    let query = supabase.from("conversations").select("id").order("updated_at", { ascending: false }).limit(1);
    query = subjectId ? query.eq("subject_id", subjectId) : query.is("subject_id", null);
    const { data: existing } = await query.maybeSingle();
    if (existing) return { ok: true, id: existing.id as string };
  }
  const { data } = await supabase.from("conversations").insert({ subject_id: subjectId, title: title.slice(0, 80) }).select("id").single();
  return data ? { ok: true, id: data.id as string } : { ok: false, message: "Nu am putut porni conversația. Încearcă din nou.", retryable: true };
}

/** Salvează poza din chat în bucketul privat (doar folderul propriu, prin RLS). */
async function storeChatImage(userId: string, dataUrl: string): Promise<string | null> {
  const match = IMAGE_DATA_URL.exec(dataUrl);
  if (!match) return null;
  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const path = `${userId}/chat/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  const supabase = await createClient();
  const { error } = await supabase.storage.from("materials").upload(path, bytes, { contentType: `image/${match[1]}`, upsert: false });
  return error ? null : path;
}
