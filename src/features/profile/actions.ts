"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrorsFrom, type FormState } from "@/features/auth/schemas";
import { SUBJECT_COLORS } from "@/lib/contracts/domain";
import { z } from "zod";
import { describeAiError } from "@/lib/ai/client";
import { getAiConfig } from "@/lib/ai/config";
import { toDateKey } from "@/lib/time/zone";
import { ONBOARDING_SUBJECTS_MAX, OnboardingSchema, cleanSubjectName, uniqueSubjects } from "./onboarding";
import {
  IMAGE_DATA_URL,
  PREVIEW_SCHEDULE,
  SCHEDULE_IMAGE_MAX_CHARS,
  ScheduleListSchema,
  professorsBySubject,
  scheduleToEvents,
  type ScheduleEntry,
} from "./schedule";
import { ScheduleVisionUnavailableError, readScheduleImage, scheduleVisionAvailable } from "./schedule-ai";
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
    // Coloana veche, cu o singură valoare: primul moment ales. Lista completă e în preferred_times.
    preferred_time: v.preferredTimes[0] ?? "fara_preferinta",
    session_minutes: v.sessionMinutes,
    daily_study_limit_minutes: v.dailyStudyLimitMinutes,
  };
}

function rawValues(formData: FormData) {
  return Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)]));
}

/** Formularul de profil: valorile pentru reafișare (text) și datele pentru validare (momentele zilei ca listă). */
function profileInput(formData: FormData) {
  const times = formData.getAll("preferredTimes").map(String);
  const values = { ...rawValues(formData), preferredTimes: times.join(",") };
  return { values, parsed: ProfileFormSchema.safeParse({ ...values, preferredTimes: times }) };
}

/** Lista momentelor zilei (migrație separată; dacă lipsește, rămâne doar coloana veche). */
async function savePreferredTimes(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, times: string[]) {
  const { error } = await supabase.from("profiles").update({ preferred_times: times }).eq("id", userId);
  return !error || isMissingColumn(error);
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return PREVIEW_STATE;
  const user = await requireUser();

  const { values, parsed } = profileInput(formData);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(toColumns(parsed.data)).eq("id", user.id);
  if (error || !(await savePreferredTimes(supabase, user.id, parsed.data.preferredTimes))) {
    return { status: "error", message: "Nu am putut salva profilul. Încearcă din nou.", values };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Profilul a fost salvat.", values };
}

/** Finalul configurării inițiale: salvează ce a completat studentul și marchează configurarea ca făcută. */
export async function completeOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) redirect("/azi");
  const user = await requireUser();

  const { values, parsed } = profileInput(formData);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...toColumns(parsed.data), onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error || !(await savePreferredTimes(supabase, user.id, parsed.data.preferredTimes))) {
    return { status: "error", message: "Nu am putut salva. Încearcă din nou.", values };
  }

  revalidatePath("/", "layout");
  redirect("/azi");
}

/** Coloana lipsește (migrația `profile_onboarding` nu e încă aplicată pe proiectul Supabase). */
function isMissingColumn(error: { code?: string } | null) {
  return error?.code === "PGRST204" || error?.code === "42703";
}

/**
 * Finalul ghidului pe pași din /bun-venit: creează materiile alese, salvează profilul și marchează configurarea ca făcută.
 * Materiile care există deja (inclusiv arhivate) nu se dublează.
 */
export async function finishOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) redirect("/azi");
  const user = await requireUser();

  const { schedule: rawSchedule, ...values } = rawValues(formData);
  const parsed = OnboardingSchema.safeParse({
    ...values,
    needs: formData.getAll("need").map(String),
    worries: formData.getAll("worry").map(String),
    preferredTimes: formData.getAll("preferredTimes").map(String),
    subjects: formData.getAll("subject").map(String),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  const v = parsed.data;
  const schedule = parseSchedule(rawSchedule);
  if (!schedule) return { status: "error", message: "Orarul citit nu este valid. Întoarce-te la pasul cu orarul și încearcă din nou.", values };

  const supabase = await createClient();
  // Materiile din orar se adaugă și ele, cu profesorul de curs.
  const subjectNames = uniqueSubjects([...v.subjects, ...schedule.map((e) => e.subject)]);
  const professors = professorsBySubject(schedule);

  if (subjectNames.length > 0) {
    const { data: existing, error: readError } = await supabase.from("subjects").select("name");
    if (readError) return { status: "error", message: "Nu am putut salva materiile. Încearcă din nou.", values };

    const taken = new Set((existing ?? []).map((s) => cleanSubjectName(String(s.name)).toLocaleLowerCase("ro")));
    const rows = subjectNames
      .filter((name) => !taken.has(name.toLocaleLowerCase("ro")))
      .map((name, i) => ({
        name,
        color: SUBJECT_COLORS[(taken.size + i) % SUBJECT_COLORS.length],
        professor: professors.get(name.toLocaleLowerCase("ro")) ?? null,
      }));

    if (rows.length > 0) {
      let { error } = await supabase.from("subjects").insert(rows);
      // Dublură apărută între timp: le salvăm pe rând și o sărim pe cea existentă.
      if (error?.code === "23505") {
        error = null;
        for (const row of rows) {
          const res = await supabase.from("subjects").insert(row);
          if (res.error && res.error.code !== "23505") error = res.error;
        }
      }
      if (error) return { status: "error", message: "Nu am putut salva materiile. Încearcă din nou.", values };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.fullName,
      university: v.university,
      faculty: v.faculty,
      specialization: v.specialization,
      study_year: v.studyYear,
      preferred_time: v.preferredTimes[0] ?? "fara_preferinta",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { status: "error", message: "Nu am putut salva. Încearcă din nou.", values };

  // Coloane din migrații mai noi, salvate separat: lipsa uneia nu le blochează pe celelalte.
  for (const columns of [
    { age: v.age, study_needs: v.needs, study_worries: v.worries, study_goal: v.goal },
    { preferred_times: v.preferredTimes },
  ]) {
    const extra = await supabase.from("profiles").update(columns).eq("id", user.id);
    if (extra.error && !isMissingColumn(extra.error)) {
      return { status: "error", message: "Nu am putut salva toate răspunsurile. Încearcă din nou.", values };
    }
  }

  if (schedule.length > 0) {
    const { data: subjects, error: idsError } = await supabase.from("subjects").select("id, name");
    if (idsError) return { status: "error", message: "Nu am putut salva orarul. Încearcă din nou.", values };
    const ids = new Map((subjects ?? []).map((s) => [cleanSubjectName(String(s.name)).toLocaleLowerCase("ro"), String(s.id)]));
    const thisWeek = values.weekParity === "para" ? "para" : "impara";
    const rows = scheduleToEvents(schedule, toDateKey(new Date()), ids, thisWeek);
    const { error: eventsError } = await supabase.from("events").insert(rows);
    if (eventsError) return { status: "error", message: "Nu am putut salva orarul. Încearcă din nou.", values };
    revalidatePath("/calendar");
  }

  revalidatePath("/", "layout");
  redirect(v.next === "materii" ? "/materii" : "/azi");
}

/** Orarul confirmat în ghid (JSON într-un câmp ascuns). Lipsă = fără orar; invalid = null. */
function parseSchedule(raw: string | undefined): ScheduleEntry[] | null {
  if (!raw) return [];
  try {
    const parsed = ScheduleListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const ReadScheduleSchema = z.object({
  image: z.string().max(SCHEDULE_IMAGE_MAX_CHARS, "Poza e prea mare. Încearcă o captură de ecran.").regex(IMAGE_DATA_URL, "Poza nu este validă."),
  university: z.string().trim().max(160),
  faculty: z.string().trim().max(160),
  specialization: z.string().trim().max(160),
  studyYear: z.string().trim().max(2),
  group: z.string().trim().max(40),
  subjects: z.array(z.string().trim().max(120)).max(ONBOARDING_SUBJECTS_MAX),
});

const SCHEDULE_UNAVAILABLE = "Citirea orarului din poze nu este activă acum. Sari peste acest pas și adaugă orele din Calendar.";

export type ReadScheduleResult = { ok: true; entries: ScheduleEntry[]; note: string | null } | { ok: false; message: string };

/** Pasul „Vrei să-ți imporți orarul?”: AI-ul citește poza; nimic nu se salvează până la finalul ghidului. */
export async function readSchedule(input: unknown): Promise<ReadScheduleResult> {
  const parsed = ReadScheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Poza nu este validă." };
  if (isPreviewMode()) return { ok: true, entries: PREVIEW_SCHEDULE, note: null };
  const user = await requireUser();

  const config = getAiConfig();
  if (!scheduleVisionAvailable()) return { ok: false, message: SCHEDULE_UNAVAILABLE };

  const supabase = await createClient();
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", hourAgo);
  if ((count ?? 0) >= config.requestsPerHour) {
    return { ok: false, message: "Ai folosit AI-ul de multe ori în ultima oră. Sari peste acum și adaugă orarul mai târziu." };
  }

  const { image, ...context } = parsed.data;
  try {
    const result = await readScheduleImage({ image, context, userId: user.id });
    await supabase.from("ai_usage").insert({ kind: "orar", model: result.model, input_tokens: result.usage.inputTokens, output_tokens: result.usage.outputTokens });
    if (result.entries.length === 0) {
      return { ok: false, message: result.note ?? "Nu am găsit ore în poză. Încearcă o poză mai clară, cu tot orarul." };
    }
    return { ok: true, entries: result.entries, note: result.note };
  } catch (error) {
    if (error instanceof ScheduleVisionUnavailableError) {
      return { ok: false, message: SCHEDULE_UNAVAILABLE };
    }
    await supabase.from("ai_usage").insert({ kind: "orar", model: config.model, ok: false });
    if (error instanceof SyntaxError) return { ok: false, message: "Nu am reușit să citesc orarul. Încearcă din nou sau cu o poză mai clară." };
    return { ok: false, message: describeAiError(error).message };
  }
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
