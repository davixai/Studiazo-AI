import { LibraryBig } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/features/notes/format";
import { weeklyCounts } from "@/features/subjects/chart-math";
import { ArchivedSubjects } from "@/features/subjects/components/archived-subjects";
import { ActivityPanel, ContentPanel, OverviewPanel, RecentPanel, SparkStat, SubjectCard } from "@/features/subjects/components/library";
import { SubjectDialog } from "@/features/subjects/components/subject-dialog";
import { getLibraryOverview, listArchivedSubjects } from "@/features/subjects/queries";
import { EmptyState } from "@/components/ui/empty-state";
import { SUBJECT_COLORS, type Subject, type SubjectColor } from "@/lib/contracts/domain";
import { formatDayShort } from "@/lib/time/format";
import { fromLocal } from "@/lib/time/zone";

export const metadata: Metadata = { title: "Materii" };

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function SubjectsPage() {
  const [overview, archived] = await Promise.all([getLibraryOverview(), listArchivedSubjects()]);
  const { subjects, totals } = overview;
  const now = new Date();
  const addButton = <SubjectDialog mode="create" defaultColor={nextColor(subjects)} />;

  const materialWeeks = weeklyCounts(overview.materialDates, now);
  const noteWeeks = weeklyCounts(overview.noteDates, now);
  const activityWeeks = materialWeeks.map((w, i) => ({ weekKey: w.weekKey, count: w.count + noteWeeks[i].count }));
  const weekLabels = activityWeeks.map((w) => formatDayShort(fromLocal(w.weekKey, "12:00")));

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
          {/* Rândul 1: privirea de ansamblu (întunecată) și două statistici cu mini-grafice. */}
          <section aria-label="Pe scurt" className="grid grid-cols-2 gap-4 lg:grid-cols-12 lg:gap-5">
            <OverviewPanel totals={totals} index={1} className="col-span-2 lg:col-span-6" />
            <SparkStat
              id="stat-materiale"
              title="Materiale"
              total={totals.pdfs + totals.photos}
              weeks={materialWeeks}
              color="accent"
              index={2}
              className="col-span-1 lg:col-span-3"
            />
            <SparkStat
              id="stat-notite"
              title="Notițe"
              total={totals.notes}
              weeks={noteWeeks}
              color="teal"
              index={3}
              className="col-span-1 lg:col-span-3"
            />
          </section>

          {/* Rândul 2: activitatea pe săptămâni și ce ai adăugat recent. */}
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
            <ActivityPanel weeks={activityWeeks} labels={weekLabels} index={4} className="lg:col-span-8" />
            <RecentPanel
              index={5}
              className="lg:col-span-4"
              items={overview.recent.map((r) => ({ ...r, label: formatRelativeTime(new Date(r.at), now) }))}
            />
          </div>

          {/* Rândul 3: materiile și distribuția conținutului. */}
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-5">
            <section aria-labelledby="materiile-tale" className="flex min-w-0 flex-col gap-3 lg:col-span-8">
              <h2 id="materiile-tale" className="flex items-baseline gap-2 text-[15px] font-bold tracking-[-0.015em] text-ink">
                Materiile tale
                <span className="text-[13px] font-medium text-ink-muted tabular">{subjects.length}</span>
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {subjects.map((subject, i) => (
                  // `stagger` pe <li> și `lift` pe card: ambele animă transform, deci stau pe elemente diferite.
                  <li key={subject.id} className="stagger" style={delay(Math.min(i + 6, 12))}>
                    <SubjectCard subject={subject} />
                  </li>
                ))}
              </ul>
            </section>
            <div className="min-w-0 lg:col-span-4 lg:pt-8">
              <ContentPanel subjects={subjects} index={6} />
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
