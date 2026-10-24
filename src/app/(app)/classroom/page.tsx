import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
  // Fără cheile Google (docs/SETUP.md, „Google Classroom”) arătăm doar că conectarea nu e activă.
  const configured = !isPreviewMode() && isClassroomConfigured();
  const connected = configured && Boolean(await readToken(user.id));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Google Classroom"
        description="Alegi clasele și fișierele din Classroom pe care le vrei în Studiazo. Asistentul AI le citește apoi ca pe orice material încărcat de tine."
      />
      {configured ? (
        <ClassroomImport connected={connected} error={typeof eroare === "string" ? eroare : null} />
      ) : (
        <Card>
          <EmptyState
            icon={<GraduationCap aria-hidden="true" />}
            title="Conectarea cu Google Classroom nu este încă activă"
            description="Imediat ce o activăm, butonul Classroom din meniu te duce direct la conectarea cu contul tău Google."
          />
        </Card>
      )}
    </div>
  );
}
