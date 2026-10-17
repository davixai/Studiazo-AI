import "server-only";
import type { Proposal } from "@/lib/contracts/proposals";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PROPOSAL_COLUMNS, toProposal } from "@/lib/supabase/mappers";

// Proprietar: David. Folosit de chat (afișarea propunerilor dintr-o conversație).

export async function getProposal(id: string): Promise<Proposal | null> {
  if (isPreviewMode()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("ai_proposals").select(PROPOSAL_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Nu am putut citi propunerea: ${error.message}`);
  return data ? toProposal(data) : null;
}
