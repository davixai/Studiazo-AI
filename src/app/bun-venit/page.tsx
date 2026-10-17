import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { SetupRequired } from "@/components/layout/setup-required";
import { skipOnboarding } from "@/features/profile/actions";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getProfile } from "@/features/profile/queries";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode, isSupabaseConfigured } from "@/lib/env";
import { firstName } from "@/lib/utils";

export const metadata: Metadata = { title: "Bun venit" };

export default async function OnboardingPage() {
  if (!isSupabaseConfigured() && !isPreviewMode()) return <SetupRequired />;
  await requireUser();
  const profile = await getProfile();
  if (!profile) return <SetupRequired />;

  const name = firstName(profile.fullName);

  return (
    <div className="min-h-dvh px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10">
      <Logo />
      <main className="mx-auto w-full max-w-2xl py-12 sm:py-16">
        <p className="mb-3 text-[13px] font-medium text-ink-muted">Configurare · aproximativ un minut</p>
        <h1 className="font-display text-[34px] leading-[1.1] font-medium tracking-[-0.02em] sm:text-[42px]">
          {name ? `Bun venit, ${name}.` : "Bun venit."}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-ink-soft">
          Câteva detalii ne ajută să-ți organizăm săptămâna. Totul e opțional, în afară de nume, și poate fi schimbat oricând din
          Profil.
        </p>

        <div className="mt-10 rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-8">
          <ProfileForm
            profile={profile}
            mode="onboarding"
            secondaryAction={
              <button
                formAction={skipOnboarding}
                formNoValidate
                className="h-12 rounded-md px-4 text-[15px] font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                Completez mai târziu
              </button>
            }
          />
        </div>
      </main>
    </div>
  );
}
