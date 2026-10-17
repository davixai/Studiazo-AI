import "server-only";
import { isPreviewMode } from "@/lib/env";
import { PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import { createClient } from "@/lib/supabase/server";
import { SubjectIdSchema } from "@/features/subjects/schemas";
import { NOTE_COLUMNS, toNote, type Note } from "./types";

// Proprietar: Sergiu. RLS limitează rezultatele la utilizatorul curent.

/** Notițele unei materii, cele modificate recent primele. */
export async function listNotes(subjectId: string): Promise<Note[]> {
  if (!SubjectIdSchema.safeParse(subjectId).success) return [];
  if (isPreviewMode()) return previewNotes(subjectId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("subject_id", subjectId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Nu am putut citi notițele: ${error.message}`);
  return (data ?? []).map(toNote);
}

/** Doar pentru modul previzualizare (capturi): două notițe demonstrative la prima materie. */
function previewNotes(subjectId: string): Note[] {
  if (subjectId !== PREVIEW_SUBJECTS[0]?.id) return [];
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  return [
    {
      id: "00000000-0000-4000-8000-0000000000b1",
      subjectId,
      title: "Arbori binari de căutare (demo)",
      content:
        "Inserare, căutare și ștergere în O(h), unde h este înălțimea arborelui.\n\nLa ștergerea unui nod cu doi copii: înlocuiesc cu succesorul în inordine (minimul din subarborele drept).\n\nDe recitit: rotațiile din arborii AVL.",
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(2),
    },
    {
      id: "00000000-0000-4000-8000-0000000000b2",
      subjectId,
      title: "Întrebări pentru seminar (demo)",
      content: "1. De ce heap-ul binar se ține într-un vector?\n2. Complexitatea pentru build-heap: O(n), nu O(n log n).",
      createdAt: hoursAgo(80),
      updatedAt: hoursAgo(76),
    },
  ];
}
