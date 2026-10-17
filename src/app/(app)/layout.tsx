import { redirect } from "next/navigation";
import { MobileTabBar, MobileTopBar, Sidebar } from "@/components/layout/app-nav";
import { SetupRequired } from "@/components/layout/setup-required";
import { getProfile } from "@/features/profile/queries";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode, isSupabaseConfigured } from "@/lib/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured() && !isPreviewMode()) return <SetupRequired />;

  await requireUser();
  const profile = await getProfile();
  if (profile && !profile.onboardingCompletedAt) redirect("/bun-venit");

  const name = profile?.fullName ?? "";
  const detail = [profile?.specialization, profile?.studyYear ? `anul ${profile.studyYear}` : null].filter(Boolean).join(", ") || null;

  return (
    <div className="flex min-h-dvh">
      <a
        href="#continut"
        className="sr-only z-50 rounded-md bg-night px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Sari la conținut
      </a>
      <Sidebar userName={name} userDetail={detail} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar userName={name} />
        {isPreviewMode() ? (
          <div className="border-b border-warning/15 bg-warning-soft px-4 py-2 text-center text-[13px] text-warning sm:px-6">
            <strong className="font-semibold">Mod previzualizare</strong> · Date demonstrative, Supabase nu este conectat.
          </div>
        ) : null}
        <main
          id="continut"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-7 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-12 lg:pb-16"
        >
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
