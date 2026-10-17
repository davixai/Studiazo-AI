import "server-only";
import type { Subject } from "@/lib/contracts/domain";
import { isPreviewMode } from "@/lib/env";
import { PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import { createClient } from "@/lib/supabase/server";
import { SUBJECT_COLUMNS, toSubject } from "@/lib/supabase/mappers";

// Proprietar: Sergiu. Citit și de David (asocierea activităților și termenelor cu materii).

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
