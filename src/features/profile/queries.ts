import "server-only";
import { cache } from "react";
import type { Profile } from "@/lib/contracts/domain";
import { getCurrentUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { PREVIEW_PROFILE } from "@/lib/preview/fixtures";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_COLUMNS, toProfile } from "@/lib/supabase/mappers";

export const getProfile = cache(async (): Promise<Profile | null> => {
  if (isPreviewMode()) return PREVIEW_PROFILE;

  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  if (error) throw new Error(`Nu am putut citi profilul: ${error.message}`);
  return data ? toProfile(data) : null;
});
