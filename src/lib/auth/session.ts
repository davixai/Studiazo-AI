import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isPreviewMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_USER } from "@/lib/preview/fixtures";

export type SessionUser = { id: string; email: string | null };

/**
 * Utilizatorul curent, verificat prin getClaims() (JWT validat).
 * Folosește ÎNTOTDEAUNA acest id pe server — niciodată un id primit de la client sau de la AI.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (isPreviewMode()) return PREVIEW_USER;
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return { id: data.claims.sub, email: typeof data.claims.email === "string" ? data.claims.email : null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/autentificare");
  return user;
}
