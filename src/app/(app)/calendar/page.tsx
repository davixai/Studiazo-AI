import { CalendarDays, ListChecks, Plus } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaRow } from "@/features/calendar/components/agenda-row";
import { EventDialog } from "@/features/calendar/components/event-dialog";
import { TaskDialog } from "@/features/calendar/components/task-dialog";
import { getEvent, getOccurrencesBetween, getTask, getTasksBetween } from "@/features/calendar/queries";
import { listSubjects } from "@/features/subjects/queries";
import { TASK_KINDS, type AgendaItem, type TaskKind } from "@/lib/contracts/domain";
import { formatDayLong } from "@/lib/time/format";
import { dayBounds, shiftDateKey, toDateKey, toTimeOfDay } from "@/lib/time/zone";

export const metadata: Metadata = { title: "Calendar" };

const DAYS = 14;

const NEW_EVENT_HREF = "/calendar?adauga=activitate";
const NEW_TASK_HREF = "/calendar?adauga=tema";

// Agenda pe 14 zile. ?adauga=activitate | tema | examen | … deschide formularul nou;
// ?activitate=<id>&zi=<data> și ?termen=<id> deschid editarea. Vederile zi/săptămână (D4) urmează.
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const params = await searchParams;
  const adding = one(params.adauga);
  const editingId = one(params.activitate);
  const editingTaskId = one(params.termen);
  const newTaskKind = TASK_KINDS.find((k) => k === adding);
  const now = new Date();
  const todayKey = toDateKey(now);
  const range = { start: dayBounds(todayKey).start, end: dayBounds(shiftDateKey(todayKey, DAYS - 1)).end };

  const [occurrences, tasks, subjects, editing, editingTask] = await Promise.all([
    getOccurrencesBetween(range),
    getTasksBetween(range),
    listSubjects(),
    editingId ? getEvent(editingId) : Promise.resolve(null),
    editingTaskId ? getTask(editingTaskId) : Promise.resolve(null),
  ]);
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
      <PageHeader
        title="Calendar"
        description={`Agenda pentru următoarele ${DAYS} zile. Apasă pe o activitate ca s-o modifici.`}
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <ButtonLink href={NEW_TASK_HREF} scroll={false} variant="secondary">
              <ListChecks aria-hidden="true" />
              Temă / examen
            </ButtonLink>
            <ButtonLink href={NEW_EVENT_HREF} scroll={false}>
              <Plus aria-hidden="true" />
              Activitate
            </ButtonLink>
          </div>
        }
      />

      {adding === "activitate" || editing ? (
        <EventDialog
          key={editing?.id ?? "nou"}
          event={editing}
          subjects={subjects}
          occurrenceDate={one(params.zi) ?? null}
          defaults={newEventDefaults(now)}
        />
      ) : null}

      {newTaskKind || editingTask ? (
        <TaskDialog
          key={editingTask?.id ?? newTaskKind}
          task={editingTask}
          subjects={subjects}
          defaults={newTaskDefaults(newTaskKind ?? "tema", now)}
        />
      ) : null}

      {sortedDays.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState
            icon={<CalendarDays />}
            title="Calendarul tău e gol"
            description="Adaugă-ți orarul o singură dată: cursurile și seminarele care se repetă apar automat în fiecare săptămână."
            action={
              <ButtonLink href={NEW_EVENT_HREF} scroll={false}>
                <Plus aria-hidden="true" />
                Adaugă prima activitate
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <ol className="flex flex-col gap-6">
          {sortedDays.map(([dateKey, items], index) => {
            const label = formatDayLong(dayBounds(dateKey).start);
            const isToday = dateKey === todayKey;
            return (
              <li key={dateKey} aria-label={label} className="stagger" style={{ "--i": Math.min(index, 6) } as React.CSSProperties}>
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
                          href={
                            item.type === "event"
                              ? `/calendar?activitate=${item.occurrence.event.id}&zi=${dateKey}`
                              : `/calendar?termen=${item.task.id}`
                          }
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

/** Ora rotundă următoare, ca formularul nou să pornească de la ceva plauzibil (2 ore, cât un curs). */
function newEventDefaults(now: Date) {
  const hour = Number(toTimeOfDay(now).slice(0, 2)) + 1;
  const late = hour > 21;
  const start = late || hour < 7 ? 8 : hour;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: late ? shiftDateKey(toDateKey(now), 1) : toDateKey(now),
    startTime: `${pad(start)}:00`,
    endTime: `${pad(start + 2)}:00`,
  };
}

/** Temele și proiectele: peste o săptămână, până la miezul nopții; probele: peste două săptămâni, la 9. */
function newTaskDefaults(kind: TaskKind, now: Date) {
  const timed = kind === "examen" || kind === "colocviu" || kind === "test";
  return { kind, date: shiftDateKey(toDateKey(now), timed ? 14 : 7), time: timed ? "09:00" : "23:59" };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function push(map: Map<string, AgendaItem[]>, key: string, item: AgendaItem) {
  const list = map.get(key);
  if (list) list.push(item);
  else map.set(key, [item]);
}

function startOf(item: AgendaItem) {
  return item.type === "event" ? item.occurrence.start.getTime() : new Date(item.task.dueAt).getTime();
}
