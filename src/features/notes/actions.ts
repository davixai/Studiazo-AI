"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom, type FormState } from "@/features/auth/schemas";
import { SubjectIdSchema } from "@/features/subjects/schemas";
import { NoteFormSchema, NoteIdSchema } from "./schemas";

// user_id nu se trimite: `default auth.uid()` + RLS (care verifică și că materia îți aparține).

const PREVIEW_STATE: FormState = {
  status: "error",
  message: "Modul previzualizare nu salvează date. Conectează Supabase pentru a salva notițele.",
};

const NOT_FOUND = "Notița nu mai există. Reîncarcă pagina.";

function revalidateSubject(subjectId: string) {
  revalidatePath(`/materii/${subjectId}`);
  revalidatePath("/materii"); // numărul de notițe de pe card
}

/** Creează notița (fără `id`) sau o actualizează (cu `id`). */
export async function saveNote(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const values = { title: String(formData.get("title") ?? ""), content: String(formData.get("content") ?? "") };
  const subjectId = SubjectIdSchema.safeParse(formData.get("subjectId"));
  if (!subjectId.success) return { status: "error", message: "Materia nu mai există. Reîncarcă pagina.", values };

  const parsed = NoteFormSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const rawId = formData.get("id");

  if (rawId) {
    const id = NoteIdSchema.safeParse(rawId);
    if (!id.success) return { status: "error", message: NOT_FOUND, values };
    const { data, error } = await supabase
      .from("notes")
      .update(parsed.data)
      .eq("id", id.data)
      .eq("subject_id", subjectId.data)
      .select("id");
    if (error) return { status: "error", message: "Nu am putut salva notița. Încearcă din nou.", values };
    if (!data?.length) return { status: "error", message: NOT_FOUND, values };
  } else {
    const { error } = await supabase.from("notes").insert({ ...parsed.data, subject_id: subjectId.data });
    if (error) return { status: "error", message: "Nu am putut salva notița. Încearcă din nou.", values };
  }

  revalidateSubject(subjectId.data);
  return { status: "success", message: rawId ? "Notița a fost salvată." : "Notița a fost adăugată." };
}

export async function deleteNote(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const id = NoteIdSchema.safeParse(formData.get("id"));
  const subjectId = SubjectIdSchema.safeParse(formData.get("subjectId"));
  if (!id.success || !subjectId.success) return { status: "error", message: NOT_FOUND };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id.data)
    .eq("subject_id", subjectId.data)
    .select("id");
  if (error) return { status: "error", message: "Nu am putut șterge notița. Încearcă din nou." };
  if (!data?.length) return { status: "error", message: NOT_FOUND };

  revalidateSubject(subjectId.data);
  return { status: "success", message: "Notița a fost ștearsă." };
}
