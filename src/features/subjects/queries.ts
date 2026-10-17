import "server-only";
import type { Subject } from "@/lib/contracts/domain";
import { isPreviewMode } from "@/lib/env";
import { PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import { createClient } from "@/lib/supabase/server";
import { SUBJECT_COLUMNS, toSubject } from "@/lib/supabase/mappers";
import { PREVIEW_MATERIALS } from "@/features/materials/preview";
import { previewNotes } from "@/features/notes/preview";
import { SubjectIdSchema } from "./schemas";

// Proprietar: Sergiu. Citit și de David (calendar, termene, asistent).
// Nicio funcție nu primește user_id: RLS limitează rezultatele la utilizatorul curent.

export async function listSubjects(): Promise<Subject[]> {
  if (isPreviewMode()) return PREVIEW_SUBJECTS;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select(SUBJECT_COLUMNS)
    .is("archived_at", null)
    .order("name");

  if (error) throw new Error(`Nu am putut citi materiile: ${error.message}`);
  return (data ?? []).map(toSubject);
}

export type SubjectWithCounts = Subject & { materialCount: number; noteCount: number };

/** Materiile active cu numărul de materiale și notițe (cardurile din /materii). */
export async function listSubjectsWithCounts(): Promise<SubjectWithCounts[]> {
  if (isPreviewMode()) {
    // Aceleași date demonstrative ca pe pagina materiei, ca numerele să se potrivească.
    const notes = previewNotes();
    return PREVIEW_SUBJECTS.map((s) => ({
      ...s,
      materialCount: PREVIEW_MATERIALS.filter((m) => m.subjectId === s.id).length,
      noteCount: notes.filter((n) => n.subjectId === s.id).length,
    }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select(`${SUBJECT_COLUMNS}, materials(count), notes(count)`)
    .is("archived_at", null)
    .order("name");

  if (error) throw new Error(`Nu am putut citi materiile: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...toSubject(row),
    materialCount: embeddedCount(row.materials),
    noteCount: embeddedCount(row.notes),
  }));
}

/** PostgREST întoarce numărarea unei relații ca `[{ count: n }]`. */
function embeddedCount(value: unknown) {
  return Array.isArray(value) && typeof value[0]?.count === "number" ? value[0].count : 0;
}

/** Materiile arhivate, cele mai recente primele (pentru „Restaurează”). */
export async function listArchivedSubjects(): Promise<Subject[]> {
  if (isPreviewMode()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select(SUBJECT_COLUMNS)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (error) throw new Error(`Nu am putut citi materiile arhivate: ${error.message}`);
  return (data ?? []).map(toSubject);
}

/** O materie activă după id; null dacă id-ul e invalid, materia e arhivată sau aparține altcuiva. */
export async function getSubject(id: string): Promise<Subject | null> {
  if (!SubjectIdSchema.safeParse(id).success) return null;
  if (isPreviewMode()) return PREVIEW_SUBJECTS.find((s) => s.id === id) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select(SUBJECT_COLUMNS)
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (error) throw new Error(`Nu am putut citi materia: ${error.message}`);
  return data ? toSubject(data) : null;
}
