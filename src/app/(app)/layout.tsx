import { redirect } from "next/navigation";
import { MobileTabBar, MobileTopBar, Sidebar } from "@/components/layout/app-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SetupRequired } from "@/components/layout/setup-required";
import { AiDock } from "@/features/assistant/components/ai-dock";
import { getProfile } from "@/features/profile/queries";
import { listSubjects } from "@/features/subjects/queries";
import { getAiStatus } from "@/lib/ai/config";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode, isSupabaseConfigured } from "@/lib/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured() && !isPreviewMode()) return <SetupRequired />;

  await requireUser();
  // Profilul și materiile (pentru asistentul plutitor) se citesc în paralel, nu una după alta.
  const [profile, subjects] = await Promise.all([getProfile(), listSubjects()]);
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
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-7 pb-4 sm:px-6 lg:px-10 lg:pt-12 lg:pb-4"
        >
          {children}
        </main>
        <SiteFooter />
      </div>
      <MobileTabBar />
      <AiDock subjects={subjects} aiAvailable={getAiStatus().available && !isPreviewMode()} />
    </div>
  );
}
