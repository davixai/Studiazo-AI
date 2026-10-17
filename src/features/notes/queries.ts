import "server-only";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { SubjectIdSchema } from "@/features/subjects/schemas";
import { previewNotes } from "./preview";
import { NOTE_COLUMNS, toNote, type Note } from "./types";

// Proprietar: Sergiu. RLS limitează rezultatele la utilizatorul curent.

/** Notițele unei materii, cele modificate recent primele. */
export async function listNotes(subjectId: string): Promise<Note[]> {
  if (!SubjectIdSchema.safeParse(subjectId).success) return [];
  if (isPreviewMode()) return previewNotes().filter((n) => n.subjectId === subjectId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("subject_id", subjectId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Nu am putut citi notițele: ${error.message}`);
  return (data ?? []).map(toNote);
}
