import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ClassroomImport } from "@/features/classroom/components/classroom-import";
import { ClassroomPreview } from "@/features/classroom/components/classroom-preview";
import { isClassroomConfigured, readToken } from "@/features/classroom/google";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";

export const metadata: Metadata = { title: "Google Classroom" };

// Importul unui fișier (descărcare din Drive + extragerea textului) poate dura mai mult decât implicit.
export const maxDuration = 60;

export default async function ClassroomPage({ searchParams }: PageProps<"/classroom">) {
  const user = await requireUser();
  const { eroare } = await searchParams;
  // Fără cheile Google (docs/SETUP.md, „Google Classroom”) arătăm un exemplu de cum arată după conectare.
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
        <ClassroomPreview />
      )}
    </div>
  );
}
