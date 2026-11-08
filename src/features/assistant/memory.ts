import "server-only";
import { AI_LIMITS } from "@/lib/contracts/ai-limits";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// Memoria asistentului: lucruri pe care studentul i le-a spus în chat (tabelul assistant_memories, RLS).
// Dacă migrația nu e încă aplicată, citirea întoarce o listă goală, iar salvarea un mesaj clar: nimic nu se blochează.

export type Memory = { id: string; content: string; createdAt: string };

export type MemoryResult = { ok: true; content: string } | { ok: false; message: string };

/** Același lucru scris altfel (majuscule, spații, punct final) nu se salvează de două ori. */
export function sameFact(a: string, b: string) {
  const norm = (s: string) => s.toLocaleLowerCase("ro").replace(/\s+/g, " ").replace(/[.!]+$/, "").trim();
  return norm(a) === norm(b);
}

export async function listMemories(): Promise<Memory[]> {
  if (isPreviewMode()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistant_memories")
    .select("id, content, created_at")
    .order("created_at", { ascending: true })
    .limit(AI_LIMITS.maxMemories);
  if (error) return [];
  return (data ?? []).map((r) => ({ id: r.id as string, content: r.content as string, createdAt: r.created_at as string }));
}

export async function saveMemory(fact: string): Promise<MemoryResult> {
  const content = fact.replace(/\s+/g, " ").trim();
  const existing = await listMemories();
  if (existing.some((m) => sameFact(m.content, content))) return { ok: true, content };
  if (existing.length >= AI_LIMITS.maxMemories) {
    return { ok: false, message: `Memoria e plină (${AI_LIMITS.maxMemories} lucruri). Studentul poate șterge ce nu mai e valabil din Profil.` };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("assistant_memories").insert({ content });
  if (error) return { ok: false, message: "Memoria nu este disponibilă încă. Nu spune că ai reținut." };
  return { ok: true, content };
}

/** Șterge un lucru reținut (RLS: doar ale studentului). Întoarce textul șters, ca să-l putem arăta. */
export async function removeMemory(id: string): Promise<MemoryResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("assistant_memories").delete().eq("id", id).select("content");
  if (error) return { ok: false, message: "Nu am putut șterge. Încearcă din nou." };
  const row = data?.[0];
  return row ? { ok: true, content: row.content as string } : { ok: false, message: "Nu am găsit acest lucru în memorie." };
}
