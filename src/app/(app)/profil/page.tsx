import { GraduationCap, LogOut, Palette } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { signOut } from "@/features/auth/actions";
import { AvailabilityForm } from "@/features/profile/components/availability-form";
import { DeleteAccount } from "@/features/profile/components/delete-account";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { ThemeSwitch } from "@/features/profile/components/theme-switch";
import { getProfile, getStudyProfile } from "@/features/profile/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { getTheme } from "@/lib/theme/server";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const [profile, user, study, theme] = await Promise.all([getProfile(), getCurrentUser(), getStudyProfile(), getTheme()]);
  if (!profile) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 xl:max-w-none">
      <PageHeader title="Profil" description="Datele tale de student și felul în care preferi să înveți." />

      {/* Pe ecrane mari: două coloane de înălțimi apropiate. Sub xl, coloanele dispar (contents), iar order păstrează ordinea de pe mobil. */}
      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-2 xl:items-start">
        <div className="contents xl:flex xl:flex-col xl:gap-8">
          <Card className="stagger p-5 sm:p-8" style={{ "--i": 1 } as React.CSSProperties}>
            <ProfileForm profile={profile} preferredTimes={study?.times} mode="profile" />
          </Card>

          <Card className="stagger divide-y divide-line max-xl:order-5" style={{ "--i": 4 } as React.CSSProperties}>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-[15px] font-semibold">Cont</h2>
                <p className="mt-1 text-sm text-ink-muted">{user?.email ?? "—"}</p>
              </div>
              <form action={signOut}>
                <Button type="submit" variant="secondary">
                  <LogOut aria-hidden="true" />
                  Deconectează-te
                </Button>
              </form>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-[15px] font-semibold">Ștergerea contului</h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-ink-muted">Șterge definitiv contul și toate datele asociate.</p>
              </div>
              <DeleteAccount />
            </div>
          </Card>
        </div>

        <div className="contents xl:flex xl:flex-col xl:gap-8">
          <Card id="disponibilitate" className="stagger scroll-mt-24 p-5 max-xl:order-2 sm:p-8" style={{ "--i": 2 } as React.CSSProperties}>
            <AvailabilityForm availability={profile.availability} />
          </Card>

          <Card className="stagger flex items-center justify-between gap-4 p-5 max-xl:order-3 sm:p-6" style={{ "--i": 3 } as React.CSSProperties}>
            <div className="flex items-start gap-4">
              <IconBadge icon={Palette} color="violet" />
              <div>
                <h2 className="text-[15px] font-semibold">Temă</h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-ink-muted">
                  Întunecată, cu mov (implicit), sau deschisă. Se ține minte pe acest dispozitiv.
                </p>
              </div>
            </div>
            <ThemeSwitch initialTheme={theme} />
          </Card>

          <Card
            className="stagger flex flex-col gap-4 p-5 max-xl:order-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <div className="flex items-start gap-4">
              <IconBadge icon={GraduationCap} color="green" />
              <div>
                <h2 className="text-[15px] font-semibold">Google Classroom</h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-ink-muted">
                  Importă cursurile, temele și documentele. Asistentul AI le poate citi imediat.
                </p>
              </div>
            </div>
            <ButtonLink href="/classroom" variant="secondary">
              Conectează
            </ButtonLink>
          </Card>
        </div>
      </div>
    </div>
  );
}
