import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { ClassroomImport } from "@/features/classroom/components/classroom-import";
import { isClassroomConfigured, readToken } from "@/features/classroom/google";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";

export const metadata: Metadata = { title: "Google Classroom" };

// Importul unui fișier (descărcare din Drive + extragerea textului) poate dura mai mult decât implicit.
export const maxDuration = 60;

export default async function ClassroomPage({ searchParams }: PageProps<"/classroom">) {
  const user = await requireUser();
  const { eroare } = await searchParams;
  const configured = !isPreviewMode() && isClassroomConfigured();
  const connected = configured && Boolean(await readToken(user.id));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Google Classroom"
        description="Importă cursurile, temele și documentele din Classroom. Asistentul AI le citește apoi ca pe orice material încărcat de tine."
      />
      {configured ? (
        <ClassroomImport connected={connected} error={typeof eroare === "string" ? eroare : null} />
      ) : (
        <Alert tone="warning" title="Conectarea cu Google nu este configurată">
          Adaugă <code>GOOGLE_CLIENT_ID</code> și <code>GOOGLE_CLIENT_SECRET</code> în <code>.env.local</code> și repornește serverul. Pașii sunt în
          docs/SETUP.md, secțiunea „Google Classroom”.
        </Alert>
      )}
    </div>
  );
}
