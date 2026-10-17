import "server-only";
import type { Proposal } from "@/lib/contracts/proposals";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PROPOSAL_COLUMNS, toProposal } from "@/lib/supabase/mappers";

// Fiecare chat (general sau al unei materii) are mai multe conversații; implicit se deschide ultima.
// Pozele trimise în chat stau în bucketul privat `materials`, sub {user_id}/chat/, și se arată prin URL semnat.

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  proposalIds: string[];
  hasImage: boolean;
  imageUrl: string | null;
};

export type ConversationSummary = { id: string; title: string; updatedAt: string };

export type ChatThread = {
  conversationId: string | null;
  messages: ChatMessage[];
  proposals: Record<string, Proposal>;
};

/** O conversație nouă, încă fără mesaje (se creează la primul mesaj). */
export const NEW_CONVERSATION = "nou";

const MAX_MESSAGES = 1000;
const IMAGE_URL_SECONDS = 3600;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Metadata = { proposalIds?: unknown; image?: unknown; imagePath?: unknown };

export function imagePathOf(metadata: unknown): string | null {
  const path = (metadata as Metadata | null)?.imagePath;
  return typeof path === "string" && path.length > 0 ? path : null;
}

export function toChatMessage(r: Record<string, unknown>, imageUrls: Map<string, string> = new Map()): ChatMessage {
  const metadata = (r.metadata ?? {}) as Metadata;
  const path = imagePathOf(metadata);
  return {
    id: r.id as string,
    role: r.role as ChatMessage["role"],
    content: r.content as string,
    createdAt: r.created_at as string,
    proposalIds: Array.isArray(metadata.proposalIds) ? metadata.proposalIds.filter((p): p is string => typeof p === "string") : [],
    hasImage: metadata.image === true,
    imageUrl: path ? (imageUrls.get(path) ?? null) : null,
  };
}

/** Conversațiile unui chat, de la cea mai recentă. */
export async function listConversations(subjectId: string | null): Promise<ConversationSummary[]> {
  if (isPreviewMode()) return [];
  const supabase = await createClient();
  let query = supabase.from("conversations").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(50);
  query = subjectId ? query.eq("subject_id", subjectId) : query.is("subject_id", null);
  const { data, error } = await query;
  if (error) throw new Error(`Nu am putut citi conversațiile: ${error.message}`);
  return (data ?? []).map((c) => ({ id: c.id as string, title: c.title as string, updatedAt: c.updated_at as string }));
}

/**
 * Conversația cerută (id), una nouă („nou”) sau, implicit, ultima conversație a chatului.
 * Un id care nu e al acestui chat (altă materie, alt cont) întoarce null.
 */
export async function getChatThread(subjectId: string | null, selection: string | null): Promise<ChatThread | null> {
  const empty: ChatThread = { conversationId: null, messages: [], proposals: {} };
  if (isPreviewMode() || selection === NEW_CONVERSATION) return empty;

  const supabase = await createClient();
  let query = supabase.from("conversations").select("id, subject_id");
  if (selection) {
    if (!UUID_RE.test(selection)) return null;
    query = query.eq("id", selection);
  } else {
    query = (subjectId ? query.eq("subject_id", subjectId) : query.is("subject_id", null)).order("updated_at", { ascending: false }).limit(1);
  }
  const { data: conversation, error } = await query.maybeSingle();
  if (error) throw new Error(`Nu am putut citi conversația: ${error.message}`);
  if (!conversation) return selection ? null : empty;
  if ((conversation.subject_id ?? null) !== subjectId) return null;

  const [{ data: rows, error: messagesError }, { data: proposalRows }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, role, content, metadata, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(MAX_MESSAGES),
    supabase.from("ai_proposals").select(PROPOSAL_COLUMNS).eq("conversation_id", conversation.id),
  ]);
  if (messagesError) throw new Error(`Nu am putut citi mesajele: ${messagesError.message}`);

  const paths = (rows ?? []).map((r) => imagePathOf(r.metadata)).filter((p): p is string => p !== null);
  const imageUrls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("materials").createSignedUrls(paths, IMAGE_URL_SECONDS);
    for (const s of signed ?? []) if (s.path && s.signedUrl) imageUrls.set(s.path, s.signedUrl);
  }

  const proposals: Record<string, Proposal> = {};
  for (const row of proposalRows ?? []) {
    const proposal = toProposal(row);
    if (proposal) proposals[proposal.id] = proposal;
  }
  return {
    conversationId: conversation.id as string,
    messages: (rows ?? []).map((r) => toChatMessage(r, imageUrls)),
    proposals,
  };
}
