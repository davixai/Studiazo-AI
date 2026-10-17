import { ChevronRight, FileText, LibraryBig } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SUBJECT_COLOR_CLASSES } from "@/components/ui/category";
import { EmptyState } from "@/components/ui/empty-state";
import { ArchivedSubjects } from "@/features/subjects/components/archived-subjects";
import { SubjectDialog } from "@/features/subjects/components/subject-dialog";
import { subjectContentSummary } from "@/features/subjects/format";
import { listArchivedSubjects, listSubjectsWithCounts } from "@/features/subjects/queries";
import { SUBJECT_COLORS, type Subject, type SubjectColor } from "@/lib/contracts/domain";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Materii" };

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function SubjectsPage() {
  const [subjects, archived] = await Promise.all([listSubjectsWithCounts(), listArchivedSubjects()]);
  const addButton = <SubjectDialog mode="create" defaultColor={nextColor(subjects)} />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Materii"
        description="Cursurile tale în PDF, pozele și notițele, organizate pe materii."
        actions={subjects.length > 0 ? addButton : undefined}
      />

      {subjects.length === 0 ? (
        <Card className="stagger" style={delay(1)}>
          <EmptyState
            icon={<LibraryBig />}
            title="Nicio materie încă"
            description="Adaugă materiile din semestrul acesta. La fiecare poți pune apoi cursuri, poze și notițe."
            action={addButton}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject, i) => {
            const color = SUBJECT_COLOR_CLASSES[subject.color];
            return (
              // `stagger` pe <li> și `lift` pe card: ambele animă transform, deci stau pe elemente diferite.
              <li key={subject.id} className="stagger" style={delay(Math.min(i + 1, 9))}>
                <Link
                  href={`/materii/${subject.id}`}
                  className="group block h-full rounded-lg transition-transform active:scale-[0.99]"
                >
                  <Card className="lift flex h-full flex-col gap-5 p-5">
                    <div className="flex items-start justify-between">
                      <div className={cn("flex size-10 items-center justify-center rounded-md", color.soft, color.text)}>
                        <FileText className="size-5" strokeWidth={1.8} aria-hidden="true" />
                      </div>
                      <ChevronRight
                        className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink-muted"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-auto min-w-0">
                      <h2 className="text-[15px] leading-snug font-semibold break-words">{subject.name}</h2>
                      {subject.professor ? (
                        <p className="mt-0.5 truncate text-[13px] text-ink-muted">{subject.professor}</p>
                      ) : null}
                      <p className="tabular mt-2 text-[13px] font-medium text-ink-soft">
                        {subjectContentSummary(subject.materialCount, subject.noteCount)}
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ArchivedSubjects subjects={archived} />
    </div>
  );
}

/** Prima culoare încă nefolosită, ca materiile noi să se deosebească ușor între ele. */
function nextColor(subjects: Subject[]): SubjectColor {
  const used = new Set(subjects.map((s) => s.color));
  return SUBJECT_COLORS.find((c) => !used.has(c)) ?? SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
}
