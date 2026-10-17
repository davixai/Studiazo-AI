import "server-only";
import type { Proposal } from "@/lib/contracts/proposals";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PROPOSAL_COLUMNS, toProposal } from "@/lib/supabase/mappers";

// Fiecare materie are chatul ei (ultima conversație cu subject_id-ul ei); chatul general are subject_id null.

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  proposalIds: string[];
  hasImage: boolean;
};

export type ChatThread = {
  conversationId: string | null;
  messages: ChatMessage[];
  proposals: Record<string, Proposal>;
};

const MAX_SHOWN_MESSAGES = 60;

export function toChatMessage(r: Record<string, unknown>): ChatMessage {
  const metadata = (r.metadata ?? {}) as { proposalIds?: unknown; image?: unknown };
  return {
    id: r.id as string,
    role: r.role as ChatMessage["role"],
    content: r.content as string,
    createdAt: r.created_at as string,
    proposalIds: Array.isArray(metadata.proposalIds) ? metadata.proposalIds.filter((p): p is string => typeof p === "string") : [],
    hasImage: metadata.image === true,
  };
}

/** Ultima conversație a chatului (materie sau general), cu mesajele și propunerile din ea. */
export async function getChatThread(subjectId: string | null): Promise<ChatThread> {
  if (isPreviewMode()) return { conversationId: null, messages: [], proposals: {} };

  const supabase = await createClient();
  let query = supabase.from("conversations").select("id").order("updated_at", { ascending: false }).limit(1);
  query = subjectId ? query.eq("subject_id", subjectId) : query.is("subject_id", null);
  const { data: conversation, error } = await query.maybeSingle();
  if (error) throw new Error(`Nu am putut citi conversația: ${error.message}`);
  if (!conversation) return { conversationId: null, messages: [], proposals: {} };

  const [{ data: rows }, { data: proposalRows }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, role, content, metadata, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(MAX_SHOWN_MESSAGES),
    supabase.from("ai_proposals").select(PROPOSAL_COLUMNS).eq("conversation_id", conversation.id),
  ]);

  const proposals: Record<string, Proposal> = {};
  for (const row of proposalRows ?? []) {
    const proposal = toProposal(row);
    if (proposal) proposals[proposal.id] = proposal;
  }
  return {
    conversationId: conversation.id as string,
    messages: (rows ?? []).reverse().map(toChatMessage),
    proposals,
  };
}
