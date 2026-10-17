import { CalendarDays, ChevronLeft, ChevronRight, ListChecks, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EVENT_KIND_COLOR, TASK_KIND_COLOR } from "@/components/ui/category";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaRow } from "@/features/calendar/components/agenda-row";
import { EventDialog } from "@/features/calendar/components/event-dialog";
import { TaskDialog } from "@/features/calendar/components/task-dialog";
import { TimeGrid, type GridDay, type GridEvent } from "@/features/calendar/components/time-grid";
import { hourRange, layoutLanes } from "@/features/calendar/layout";
import { getEvent, getOccurrencesBetween, getTask, getTasksBetween } from "@/features/calendar/queries";
import { listSubjects } from "@/features/subjects/queries";
import { TASK_KINDS, TASK_KIND_LABELS, type AgendaItem, type TaskKind } from "@/lib/contracts/domain";
import { formatDateLong, formatDayLong, formatDayShort, formatTime, formatTimeRange, formatWeekdayShort } from "@/lib/time/format";
import { dayBounds, isDateKey, shiftDateKey, startOfWeekKey, toDateKey, toTimeOfDay } from "@/lib/time/zone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

const AGENDA_DAYS = 14;
const VIEWS = [
  { id: "agenda", label: "Agendă", className: "" },
  { id: "saptamana", label: "Săptămână", className: "hidden md:flex" },
  { id: "zi", label: "Zi", className: "" },
] as const;
type View = (typeof VIEWS)[number]["id"];

// Vederi: ?vedere=agenda (implicit, 14 zile) | saptamana | zi, cu ?data=YYYY-MM-DD.
// ?adauga=activitate | tema | examen | … deschide formularul nou; ?activitate=<id>&zi=<data> și ?termen=<id> editarea.
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const params = await searchParams;
  const view: View = VIEWS.find((v) => v.id === one(params.vedere))?.id ?? "agenda";
  const now = new Date();
  const todayKey = toDateKey(now);
  const requested = one(params.data);
  const anchor = requested && isDateKey(requested) ? requested : todayKey;

  const firstDay = view === "saptamana" ? startOfWeekKey(anchor) : view === "zi" ? anchor : todayKey;
  const dayCount = view === "saptamana" ? 7 : view === "zi" ? 1 : AGENDA_DAYS;
  const range = { start: dayBounds(firstDay).start, end: dayBounds(shiftDateKey(firstDay, dayCount - 1)).end };

  // Linkurile păstrează vederea curentă, iar dialogurile revin în ea.
  const viewQuery = view === "agenda" ? "" : `vedere=${view}&data=${anchor}`;
  const viewHref = viewQuery ? `/calendar?${viewQuery}` : "/calendar";
  const withView = (extra: string) => `/calendar?${[viewQuery, extra].filter(Boolean).join("&")}`;

  const adding = one(params.adauga);
  const editingId = one(params.activitate);
  const editingTaskId = one(params.termen);
  const newTaskKind = TASK_KINDS.find((k) => k === adding);

  const [occurrences, tasks, subjects, editing, editingTask] = await Promise.all([
    getOccurrencesBetween(range),
    getTasksBetween(range),
    listSubjects(),
    editingId ? getEvent(editingId) : Promise.resolve(null),
    editingTaskId ? getTask(editingTaskId) : Promise.resolve(null),
  ]);
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const subjectOf = (id: string | null) => (id ? (byId.get(id) ?? null) : null);
  const eventHref = (id: string, date: string) => withView(`activitate=${id}&zi=${date}`);
  const taskHref = (id: string) => withView(`termen=${id}`);
  const isEmpty = occurrences.length === 0 && tasks.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="Orarul, activitățile și termenele tale. Apasă pe ceva ca să-l modifici."
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <ButtonLink href={withView("adauga=tema")} scroll={false} variant="secondary">
              <ListChecks aria-hidden="true" />
              Temă / examen
            </ButtonLink>
            <ButtonLink href={withView("adauga=activitate")} scroll={false}>
              <Plus aria-hidden="true" />
              Activitate
            </ButtonLink>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Vedere" className="inline-flex self-start rounded-md border border-line bg-surface-muted p-0.5">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              href={v.id === "agenda" ? "/calendar" : `/calendar?vedere=${v.id}&data=${anchor}`}
              aria-current={v.id === view ? "page" : undefined}
              scroll={false}
              className={cn(
                "flex h-8 items-center rounded-[7px] px-3.5 text-[13px] font-medium transition-colors",
                v.id === view ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
                v.className,
              )}
            >
              {v.label}
            </Link>
          ))}
        </nav>

        {view !== "agenda" ? (
          <div className="flex items-center gap-1">
            <p className="mr-2 text-sm font-semibold text-ink first-letter:uppercase">
              {view === "zi" ? formatDayLong(dayBounds(anchor).start) : weekLabel(firstDay)}
            </p>
            <NavLink href={`/calendar?vedere=${view}&data=${shiftDateKey(anchor, view === "zi" ? -1 : -7)}`} label={view === "zi" ? "Ziua anterioară" : "Săptămâna anterioară"}>
              <ChevronLeft className="size-4" />
            </NavLink>
            <Link
              href={`/calendar?vedere=${view}&data=${todayKey}`}
              scroll={false}
              className="flex h-8 items-center rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink shadow-xs hover:bg-surface-muted"
            >
              Azi
            </Link>
            <NavLink href={`/calendar?vedere=${view}&data=${shiftDateKey(anchor, view === "zi" ? 1 : 7)}`} label={view === "zi" ? "Ziua următoare" : "Săptămâna următoare"}>
              <ChevronRight className="size-4" />
            </NavLink>
          </div>
        ) : null}
      </div>

      {adding === "activitate" || editing ? (
        <EventDialog
          key={editing?.id ?? "nou"}
          event={editing}
          subjects={subjects}
          occurrenceDate={one(params.zi) ?? null}
          defaults={newEventDefaults(now, view === "agenda" ? null : anchor)}
          returnHref={viewHref}
        />
      ) : null}

      {newTaskKind || editingTask ? (
        <TaskDialog
          key={editingTask?.id ?? newTaskKind}
          task={editingTask}
          subjects={subjects}
          defaults={newTaskDefaults(newTaskKind ?? "tema", now)}
          returnHref={viewHref}
        />
      ) : null}

      {view === "agenda" ? (
        isEmpty ? (
          <div className="rounded-lg border border-line bg-surface">
            <EmptyState
              icon={<CalendarDays />}
              title="Calendarul tău e gol"
              description="Adaugă-ți orarul o singură dată: cursurile și seminarele care se repetă apar automat în fiecare săptămână."
              action={
                <ButtonLink href={withView("adauga=activitate")} scroll={false}>
                  <Plus aria-hidden="true" />
                  Adaugă prima activitate
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <Agenda
            items={[
              ...occurrences.map((occurrence) => ({ type: "event" as const, occurrence, subject: subjectOf(occurrence.event.subjectId) })),
              ...tasks.map((task) => ({ type: "task" as const, task, subject: subjectOf(task.subjectId) })),
            ]}
            todayKey={todayKey}
            now={now}
            eventHref={eventHref}
            taskHref={taskHref}
          />
        )
      ) : (
        <div className={cn(view === "saptamana" && "-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0")}>
          <div className={cn(view === "saptamana" && "min-w-[640px]")}>
            <WeekOrDay
              days={Array.from({ length: dayCount }, (_, i) => shiftDateKey(firstDay, i))}
              todayKey={todayKey}
              now={now}
              build={(dateKey) => {
                const bounds = dayBounds(dateKey);
                const events: GridEvent[] = occurrences
                  .filter((o) => o.start < bounds.end && o.end > bounds.start)
                  .map((o) => ({
                    id: o.event.id,
                    title: o.event.title,
                    time: formatTimeRange(o.start, o.end),
                    color: subjectOf(o.event.subjectId)?.color ?? EVENT_KIND_COLOR[o.event.kind],
                    href: eventHref(o.event.id, o.occurrenceDate),
                    done: Boolean(o.event.completedAt),
                    start: o.start,
                    end: o.end,
                  }));
                return {
                  bounds,
                  events,
                  deadlines: tasks
                    .filter((t) => toDateKey(new Date(t.dueAt)) === dateKey)
                    .map((t) => ({
                      id: t.id,
                      title: `${formatTime(new Date(t.dueAt))} ${t.title}`,
                      label: TASK_KIND_LABELS[t.kind],
                      color: subjectOf(t.subjectId)?.color ?? TASK_KIND_COLOR[t.kind],
                      href: taskHref(t.id),
                    })),
                };
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function WeekOrDay({
  days,
  todayKey,
  now,
  build,
}: {
  days: string[];
  todayKey: string;
  now: Date;
  build: (dateKey: string) => { bounds: { start: Date; end: Date }; events: GridEvent[]; deadlines: GridDay["deadlines"] };
}) {
  const gridDays: GridDay[] = days.map((dateKey) => {
    const { bounds, events, deadlines } = build(dateKey);
    return {
      dateKey,
      weekday: formatWeekdayShort(bounds.start).replace(".", ""),
      day: formatDayShort(bounds.start).split(" ")[0],
      fullLabel: formatDayLong(bounds.start),
      isToday: dateKey === todayKey,
      events: layoutLanes(events, bounds.start, bounds.end),
      deadlines,
    };
  });
  const hours = hourRange(gridDays.flatMap((d) => d.events));
  const todayStart = dayBounds(todayKey).start;
  return <TimeGrid days={gridDays} hours={hours} nowMinute={days.includes(todayKey) ? (now.getTime() - todayStart.getTime()) / 60_000 : null} />;
}

function Agenda({
  items,
  todayKey,
  now,
  eventHref,
  taskHref,
}: {
  items: AgendaItem[];
  todayKey: string;
  now: Date;
  eventHref: (id: string, date: string) => string;
  taskHref: (id: string) => string;
}) {
  const days = new Map<string, AgendaItem[]>();
  for (const item of items) {
    const key = item.type === "event" ? item.occurrence.occurrenceDate : toDateKey(new Date(item.task.dueAt));
    const list = days.get(key);
    if (list) list.push(item);
    else days.set(key, [item]);
  }
  const sortedDays = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <ol className="flex flex-col gap-6">
      {sortedDays.map(([dateKey, dayItems], index) => {
        const label = formatDayLong(dayBounds(dateKey).start);
        return (
          <li key={dateKey} aria-label={label} className="stagger" style={{ "--i": Math.min(index, 6) } as React.CSSProperties}>
            <h2 className="mb-2 flex items-baseline gap-2 px-1 text-sm font-semibold text-ink">
              <span className="first-letter:uppercase">{label}</span>
              {dateKey === todayKey ? <span className="text-[13px] font-medium text-accent">· azi</span> : null}
            </h2>
            <div className="rounded-lg border border-line bg-surface px-4 shadow-xs sm:px-5">
              <ul className="divide-y divide-line">
                {dayItems
                  .sort((a, b) => startOf(a) - startOf(b))
                  .map((item) => (
                    <AgendaRow
                      key={item.type === "event" ? `${item.occurrence.event.id}-${dateKey}` : item.task.id}
                      item={item}
                      now={now}
                      href={item.type === "event" ? eventHref(item.occurrence.event.id, dateKey) : taskHref(item.task.id)}
                    />
                  ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function NavLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
    >
      {children}
    </Link>
  );
}

/** „19 – 25 octombrie 2026” (sau peste două luni: „27 octombrie – 2 noiembrie 2026”). */
function weekLabel(monday: string) {
  const start = dayBounds(monday).start;
  const end = dayBounds(shiftDateKey(monday, 6)).start;
  const [startDay, startMonth] = formatDateLong(start).split(" ");
  const endLabel = formatDateLong(end);
  return endLabel.split(" ")[1] === startMonth ? `${startDay} – ${endLabel}` : `${startDay} ${startMonth} – ${endLabel}`;
}

/** Ora rotundă următoare (2 ore, cât un curs); în vederea zi/săptămână, ziua afișată. */
function newEventDefaults(now: Date, viewDate: string | null) {
  const hour = Number(toTimeOfDay(now).slice(0, 2)) + 1;
  const late = hour > 21;
  const start = late || hour < 7 ? 8 : hour;
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = toDateKey(now);
  return {
    date: viewDate && viewDate > today ? viewDate : late ? shiftDateKey(today, 1) : today,
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

function startOf(item: AgendaItem) {
  return item.type === "event" ? item.occurrence.start.getTime() : new Date(item.task.dueAt).getTime();
}
