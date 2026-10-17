import { FileText, LibraryBig } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { EmptyState } from "@/components/ui/empty-state";
import { listSubjects } from "@/features/subjects/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Materii" };

// Etapa 1: lista materiilor (citire). Crearea materiilor, notițele și PDF-urile vin în etapa 2 (Sergiu).
export default async function SubjectsPage() {
  const subjects = await listSubjects();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Materii"
        description="Cursurile tale în PDF și notițele, organizate pe materii. Asistentul răspunde pe baza lor."
      />

      {subjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LibraryBig />}
            title="Nicio materie încă"
            description="Adaugă o materie, apoi încarcă un curs în PDF cu text selectabil sau scrie notițe."
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => {
            const color = SUBJECT_COLOR_CLASSES[subject.color];
            return (
              <li key={subject.id}>
                <Card className="flex h-full flex-col gap-6 p-5 transition-shadow hover:shadow-md">
                  <div className={cn("flex size-10 items-center justify-center rounded-md", color.soft, color.text)}>
                    <FileText className="size-5" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className="mt-auto">
                    <h2 className="text-[15px] leading-snug font-semibold">{subject.name}</h2>
                    <p className="mt-1 text-[13px] text-ink-muted">Niciun material încă</p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[13px] leading-6 text-ink-muted">
        Formate: PDF cu text selectabil și fotografii (JPEG, PNG, WebP), maximum 20 MB. Încărcarea vine în curând.
      </p>
    </div>
  );
}
