import "server-only";
import type { Subject } from "@/lib/contracts/domain";
import { isPreviewMode } from "@/lib/env";
import { PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import { createClient } from "@/lib/supabase/server";
import { SUBJECT_COLUMNS, toSubject } from "@/lib/supabase/mappers";
import { PREVIEW_MATERIALS } from "@/features/materials/preview";
import { previewNotes } from "@/features/notes/preview";
import { buildOverview, type LibraryOverview } from "./overview";
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

/**
 * Panoul „Materii”: materiile active cu statistici (PDF-uri, poze, notițe, parcurse, pagini gata)
 * și ultimele elemente adăugate. Trei citiri în paralel; calculele sunt în overview.ts (testate).
 */
export async function getLibraryOverview(): Promise<LibraryOverview> {
  if (isPreviewMode()) {
    // Aceleași date demonstrative ca pe pagina materiei, ca numerele să se potrivească.
    const materials = PREVIEW_MATERIALS.map((m) => ({
      id: m.id,
      subjectId: m.subjectId,
      title: m.title,
      kind: m.kind === "image" ? ("image" as const) : ("pdf" as const),
      status: m.status,
      studied: Boolean(m.studiedAt),
      pageCount: m.pageCount,
      createdAt: m.createdAt,
    }));
    return buildOverview(PREVIEW_SUBJECTS, materials, previewNotes());
  }

  const supabase = await createClient();
  const [subjects, materials, notes] = await Promise.all([
    supabase.from("subjects").select(SUBJECT_COLUMNS).is("archived_at", null).order("name"),
    supabase.from("materials").select("id, subject_id, title, mime_type, status, studied_at, page_count, created_at"),
    supabase.from("notes").select("id, subject_id, title, updated_at"),
  ]);
  const error = subjects.error ?? materials.error ?? notes.error;
  if (error) throw new Error(`Nu am putut citi materiile: ${error.message}`);

  return buildOverview(
    (subjects.data ?? []).map(toSubject),
    (materials.data ?? []).map((m) => ({
      id: m.id as string,
      subjectId: m.subject_id as string,
      title: m.title as string,
      kind: (m.mime_type as string).startsWith("image/") ? ("image" as const) : ("pdf" as const),
      status: m.status as string,
      studied: Boolean(m.studied_at),
      pageCount: (m.page_count as number | null) ?? null,
      createdAt: m.created_at as string,
    })),
    (notes.data ?? []).map((n) => ({
      id: n.id as string,
      subjectId: n.subject_id as string,
      title: n.title as string,
      updatedAt: n.updated_at as string,
    })),
  );
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
