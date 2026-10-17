import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaRow } from "@/features/calendar/components/agenda-row";
import { getOccurrencesBetween, getTasksBetween } from "@/features/calendar/queries";
import { listSubjects } from "@/features/subjects/queries";
import type { AgendaItem } from "@/lib/contracts/domain";
import { formatDayLong } from "@/lib/time/format";
import { dayBounds, shiftDateKey, toDateKey } from "@/lib/time/zone";

export const metadata: Metadata = { title: "Calendar" };

const DAYS = 14;

// Etapa 1: agenda (citire). Vederile zi/săptămână și formularele vin în etapa 2 (David).
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const params = await searchParams;
  const now = new Date();
  const todayKey = toDateKey(now);
  const range = { start: dayBounds(todayKey).start, end: dayBounds(shiftDateKey(todayKey, DAYS - 1)).end };

  const [occurrences, tasks, subjects] = await Promise.all([getOccurrencesBetween(range), getTasksBetween(range), listSubjects()]);
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const subjectOf = (id: string | null) => (id ? (byId.get(id) ?? null) : null);

  const days = new Map<string, AgendaItem[]>();
  for (const occurrence of occurrences) {
    push(days, occurrence.occurrenceDate, { type: "event", occurrence, subject: subjectOf(occurrence.event.subjectId) });
  }
  for (const task of tasks) {
    push(days, toDateKey(new Date(task.dueAt)), { type: "task", task, subject: subjectOf(task.subjectId) });
  }
  const sortedDays = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Calendar" description={`Agenda pentru următoarele ${DAYS} zile.`} />

      {params.adauga ? (
        <Alert tone="info" title="Adăugarea din calendar urmează">
          Formularul pentru teme, examene și activități este în lucru. Până atunci, programul existent apare mai jos.
        </Alert>
      ) : null}

      {sortedDays.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState
            icon={<CalendarDays />}
            title="Calendarul tău e gol"
            description="Aici vor apărea cursurile, seminarele, laboratoarele, jobul și termenele tale."
          />
        </div>
      ) : (
        <ol className="flex flex-col gap-6">
          {sortedDays.map(([dateKey, items]) => {
            const label = formatDayLong(dayBounds(dateKey).start);
            const isToday = dateKey === todayKey;
            return (
              <li key={dateKey} aria-label={label}>
                <h2 className="mb-2 flex items-baseline gap-2 px-1 text-sm font-semibold text-ink first-letter:uppercase">
                  <span className="first-letter:uppercase">{label}</span>
                  {isToday ? <span className="text-[13px] font-medium text-accent">· azi</span> : null}
                </h2>
                <div className="rounded-lg border border-line bg-surface px-4 shadow-xs sm:px-5">
                  <ul className="divide-y divide-line">
                    {items
                      .sort((a, b) => startOf(a) - startOf(b))
                      .map((item) => (
                        <AgendaRow
                          key={item.type === "event" ? `${item.occurrence.event.id}-${dateKey}` : item.task.id}
                          item={item}
                          now={now}
                        />
                      ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function push(map: Map<string, AgendaItem[]>, key: string, item: AgendaItem) {
  const list = map.get(key);
  if (list) list.push(item);
  else map.set(key, [item]);
}

function startOf(item: AgendaItem) {
  return item.type === "event" ? item.occurrence.start.getTime() : new Date(item.task.dueAt).getTime();
}
