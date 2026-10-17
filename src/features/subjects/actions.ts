"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom, type FormState } from "@/features/auth/schemas";
import { SubjectFormSchema, SubjectIdSchema, type SubjectFormValues } from "./schemas";

// user_id nu se trimite: coloana are `default auth.uid()`, iar RLS permite doar rândurile proprii.

const PREVIEW_STATE: FormState = {
  status: "error",
  message: "Modul previzualizare nu salvează date. Conectează Supabase pentru a salva materiile.",
};

const DUPLICATE_NAME = "Ai deja o materie cu acest nume (poate printre cele arhivate).";
const NOT_FOUND = "Materia nu mai există. Reîncarcă pagina.";

function rawValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    professor: String(formData.get("professor") ?? ""),
    color: String(formData.get("color") ?? ""),
  };
}

function toColumns(v: SubjectFormValues) {
  return { name: v.name, professor: v.professor, color: v.color };
}

/** Numele, culoarea și profesorul apar și în calendar și pe pagina Azi. */
function revalidateSubjects() {
  revalidatePath("/", "layout");
}

export async function createSubject(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const values = rawValues(formData);
  const parsed = SubjectFormSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert(toColumns(parsed.data));
  if (error?.code === "23505") return { status: "error", fieldErrors: { name: DUPLICATE_NAME }, values };
  if (error) return { status: "error", message: "Nu am putut salva materia. Încearcă din nou.", values };

  revalidateSubjects();
  return { status: "success", message: `Am adăugat „${parsed.data.name}”.` };
}

export async function updateSubject(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const id = SubjectIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: NOT_FOUND };

  const values = rawValues(formData);
  const parsed = SubjectFormSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .update(toColumns(parsed.data))
    .eq("id", id.data)
    .is("archived_at", null)
    .select("id");
  if (error?.code === "23505") return { status: "error", fieldErrors: { name: DUPLICATE_NAME }, values };
  if (error) return { status: "error", message: "Nu am putut salva modificările. Încearcă din nou.", values };
  if (!data?.length) return { status: "error", message: NOT_FOUND, values };

  revalidateSubjects();
  return { status: "success", message: "Modificările au fost salvate." };
}

/** Arhivarea ascunde materia; notițele, materialele și testele ei rămân și revin la restaurare. */
export async function archiveSubject(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const id = SubjectIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: NOT_FOUND };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("archived_at", null)
    .select("id");
  if (error) return { status: "error", message: "Nu am putut arhiva materia. Încearcă din nou." };
  if (!data?.length) return { status: "error", message: NOT_FOUND };

  revalidateSubjects();
  redirect("/materii");
}

export async function restoreSubject(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  await requireUser();

  const id = SubjectIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: NOT_FOUND };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .update({ archived_at: null })
    .eq("id", id.data)
    .not("archived_at", "is", null)
    .select("id");
  if (error) return { status: "error", message: "Nu am putut restaura materia. Încearcă din nou." };
  if (!data?.length) return { status: "error", message: NOT_FOUND };

  revalidateSubjects();
  return { status: "success" };
}
