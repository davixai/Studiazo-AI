"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom, type FormState } from "@/features/auth/schemas";
import { DELETE_CONFIRMATION, ProfileFormSchema, availabilityFromForm, type ProfileFormValues } from "./schemas";

const PREVIEW_STATE: FormState = {
  status: "error",
  message: "Modul previzualizare nu salvează date. Conectează Supabase pentru a salva profilul.",
};

function toColumns(v: ProfileFormValues) {
  return {
    full_name: v.fullName,
    university: v.university,
    faculty: v.faculty,
    specialization: v.specialization,
    study_year: v.studyYear,
    preferred_time: v.preferredTime,
    session_minutes: v.sessionMinutes,
    daily_study_limit_minutes: v.dailyStudyLimitMinutes,
  };
}

function rawValues(formData: FormData) {
  return Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)]));
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  const user = await requireUser();

  const values = rawValues(formData);
  const parsed = ProfileFormSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(toColumns(parsed.data)).eq("id", user.id);
  if (error) return { status: "error", message: "Nu am putut salva profilul. Încearcă din nou.", values };

  revalidatePath("/", "layout");
  return { status: "success", message: "Profilul a fost salvat.", values };
}

/** Finalul configurării inițiale: salvează ce a completat studentul și marchează configurarea ca făcută. */
export async function completeOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) redirect("/azi");
  const user = await requireUser();

  const values = rawValues(formData);
  const parsed = ProfileFormSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...toColumns(parsed.data), onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { status: "error", message: "Nu am putut salva. Încearcă din nou.", values };

  revalidatePath("/", "layout");
  redirect("/azi");
}

/** „Completez mai târziu”: nu mai afișăm configurarea, datele rămân editabile din Profil. */
export async function skipOnboarding() {
  if (isPreviewMode()) redirect("/azi");
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("profiles").update({ onboarding_completed_at: new Date().toISOString() }).eq("id", user.id);
  revalidatePath("/", "layout");
  redirect("/azi");
}


/**
 * Șterge contul și toate datele asociate. Fișierele din Storage se șterg întâi (RLS: doar folderul propriu),
 * apoi funcția `delete_my_account()` șterge utilizatorul; restul datelor dispar prin ON DELETE CASCADE.
 */
export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  const user = await requireUser();

  if (String(formData.get("confirmation") ?? "").trim().toUpperCase() !== DELETE_CONFIRMATION) {
    return { status: "error", fieldErrors: { confirmation: `Scrie ${DELETE_CONFIRMATION} ca să confirmi.` } };
  }

  const supabase = await createClient();
  const bucket = supabase.storage.from("materials");
  const { data: folders } = await bucket.list(user.id, { limit: 1000 });
  for (const folder of folders ?? []) {
    const prefix = `${user.id}/${folder.name}`;
    const { data: files } = await bucket.list(prefix, { limit: 1000 });
    const paths = (files ?? []).map((f) => `${prefix}/${f.name}`);
    if (paths.length > 0) {
      const { error } = await bucket.remove(paths);
      if (error) return { status: "error", message: "Nu am putut șterge fișierele. Încearcă din nou." };
    }
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { status: "error", message: "Nu am putut șterge contul. Încearcă din nou." };

  await supabase.auth.signOut();
  redirect("/autentificare");
}

/** Intervalele în care studentul poate învăța; folosite de planificarea sesiunilor (computeFreeSlots). */
export async function saveAvailability(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  const user = await requireUser();

  const values = rawValues(formData);
  const parsed = availabilityFromForm(values);
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.fieldErrors, values };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ availability: parsed.windows }).eq("id", user.id);
  if (error) return { status: "error", message: "Nu am putut salva disponibilitatea. Încearcă din nou.", values };

  revalidatePath("/profil");
  return { status: "success", message: "Disponibilitatea a fost salvată.", values };
}
