import type { Metadata } from "next";
import { SetupRequired } from "@/components/layout/setup-required";
import { OnboardingWizard } from "@/features/profile/components/onboarding-wizard";
import { getProfile } from "@/features/profile/queries";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode, isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Bun venit" };

/** Configurarea inițială: câte o întrebare pe ecran (nume, vârstă, universitate, facultate, an, materii, obiective). */
export default async function OnboardingPage() {
  if (!isSupabaseConfigured() && !isPreviewMode()) return <SetupRequired />;
  await requireUser();
  const profile = await getProfile();
  if (!profile) return <SetupRequired />;

  return <OnboardingWizard profile={profile} />;
}
