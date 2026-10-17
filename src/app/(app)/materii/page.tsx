import { LibraryBig } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/features/notes/format";
import { ArchivedSubjects } from "@/features/subjects/components/archived-subjects";
import { ContentPanel, LibraryHero, RecentPanel, StudiedPanel, SubjectCard } from "@/features/subjects/components/library";
import { SubjectDialog } from "@/features/subjects/components/subject-dialog";
import { getLibraryOverview, listArchivedSubjects } from "@/features/subjects/queries";
import { SUBJECT_COLORS, type Subject, type SubjectColor } from "@/lib/contracts/domain";

export const metadata: Metadata = { title: "Materii" };

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function SubjectsPage() {
  const [overview, archived] = await Promise.all([getLibraryOverview(), listArchivedSubjects()]);
  const { subjects, totals } = overview;
  const now = new Date();
  const addButton = <SubjectDialog mode="create" defaultColor={nextColor(subjects)} />;

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
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
        <>
          <section aria-label="Pe scurt" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
            <div className="flex sm:col-span-2 lg:col-span-5 [&>section]:w-full">
              <LibraryHero totals={totals} index={1} />
            </div>
            <StudiedPanel studied={totals.studied} total={totals.pdfs} index={2} className="lg:col-span-3" />
            <ContentPanel subjects={subjects} index={3} className="lg:col-span-4" />
          </section>

          <div className="grid gap-6 lg:grid-cols-12 lg:gap-5">
            <section aria-labelledby="materiile-tale" className="flex min-w-0 flex-col gap-3 lg:col-span-8">
              <h2 id="materiile-tale" className="flex items-baseline gap-2 text-[15px] font-bold tracking-[-0.015em] text-ink">
                Materiile tale
                <span className="text-[13px] font-medium text-ink-muted tabular">{subjects.length}</span>
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {subjects.map((subject, i) => (
                  // `stagger` pe <li> și `lift` pe card: ambele animă transform, deci stau pe elemente diferite.
                  <li key={subject.id} className="stagger" style={delay(Math.min(i + 4, 10))}>
                    <SubjectCard subject={subject} />
                  </li>
                ))}
              </ul>
            </section>
            <div className="min-w-0 lg:col-span-4 lg:pt-8">
              <RecentPanel
                index={5}
                items={overview.recent.map((r) => ({ ...r, label: formatRelativeTime(new Date(r.at), now) }))}
              />
            </div>
          </div>
        </>
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
