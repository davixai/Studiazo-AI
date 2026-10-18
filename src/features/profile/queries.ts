import "server-only";
import { cache } from "react";
import { PREFERRED_TIMES, type Profile } from "@/lib/contracts/domain";
import { getCurrentUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { PREVIEW_PROFILE } from "@/lib/preview/fixtures";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_COLUMNS, toProfile } from "@/lib/supabase/mappers";
import { STUDY_GOALS, STUDY_NEEDS, STUDY_WORRIES, type StudyProfile } from "./onboarding";

export const getProfile = cache(async (): Promise<Profile | null> => {
  if (isPreviewMode()) return PREVIEW_PROFILE;

  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  if (error) throw new Error(`Nu am putut citi profilul: ${error.message}`);
  return data ? toProfile(data) : null;
});

const pick = <T extends string>(all: readonly T[], raw: unknown): T[] =>
  Array.isArray(raw) ? raw.filter((v): v is T => (all as readonly unknown[]).includes(v)) : [];

/**
 * Răspunsurile din configurare (vârstă, nevoi, griji, obiectiv), separat de profil:
 * dacă migrația `profile_study_lists` nu e încă aplicată, întoarce null în loc să blocheze aplicația.
 */
export const getStudyProfile = cache(async (): Promise<StudyProfile | null> => {
  if (isPreviewMode()) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("age, study_needs, study_worries, study_goal")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  // Momentele zilei vin dintr-o migrație separată; fără ea rămâne valoarea unică din profil.
  const times = await supabase.from("profiles").select("preferred_times").eq("id", user.id).maybeSingle();
  return {
    age: typeof data.age === "number" ? data.age : null,
    needs: pick(STUDY_NEEDS, data.study_needs),
    worries: pick(STUDY_WORRIES, data.study_worries),
    goal: pick(STUDY_GOALS, [data.study_goal])[0] ?? null,
    times: times.error ? [] : pick(PREFERRED_TIMES.filter((t) => t !== "fara_preferinta"), times.data?.preferred_times),
  };
});
