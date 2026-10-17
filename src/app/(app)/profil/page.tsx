import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { AvailabilityForm } from "@/features/profile/components/availability-form";
import { DeleteAccount } from "@/features/profile/components/delete-account";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getProfile } from "@/features/profile/queries";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const [profile, user] = await Promise.all([getProfile(), getCurrentUser()]);
  if (!profile) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader title="Profil" description="Datele tale de student și felul în care preferi să înveți." />

      <Card className="stagger p-5 sm:p-8" style={{ "--i": 1 } as React.CSSProperties}>
        <ProfileForm profile={profile} mode="profile" />
      </Card>

      <Card id="disponibilitate" className="stagger scroll-mt-24 p-5 sm:p-8" style={{ "--i": 2 } as React.CSSProperties}>
        <AvailabilityForm availability={profile.availability} />
      </Card>

      <Card className="stagger divide-y divide-line" style={{ "--i": 3 } as React.CSSProperties}>
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
  );
}
