import "server-only";
import { getOccurrencesBetween, getTasksBetween, getUpcomingTasks } from "@/features/calendar/queries";
import { listSubjects } from "@/features/subjects/queries";
import type { AgendaItem, EventOccurrence, Subject, Task } from "@/lib/contracts/domain";
import { APP_TIMEZONE, dayBounds, toDateKey } from "@/lib/time/zone";

export type TodayOverview = {
  now: Date;
  agenda: AgendaItem[];
  upcoming: Array<{ task: Task; subject: Subject | null }>;
  subjects: Subject[];
  /** Următoarea sesiune de studiu confirmată și nefinalizată (inclusiv cea în desfășurare), din 14 zile. */
  nextStudySession: { occurrence: EventOccurrence; subject: Subject | null } | null;
};

const STUDY_LOOKAHEAD_DAYS = 14;

/** Datele paginii „Azi”: programul zilei locale și următoarele termene. */
export async function getTodayOverview(now = new Date(), tz = APP_TIMEZONE): Promise<TodayOverview> {
  const today = dayBounds(toDateKey(now, tz), tz);
  const [occurrences, ahead, dueToday, upcoming, subjects] = await Promise.all([
    getOccurrencesBetween(today),
    getOccurrencesBetween({ start: now, end: new Date(now.getTime() + STUDY_LOOKAHEAD_DAYS * 86_400_000) }),
    getTasksBetween(today),
    getUpcomingTasks({ now, days: 30, limit: 6 }),
    listSubjects(),
  ]);

  const byId = new Map(subjects.map((s) => [s.id, s]));
  const subjectOf = (id: string | null) => (id ? (byId.get(id) ?? null) : null);

  const agenda: AgendaItem[] = [
    ...occurrences.map((occurrence) => ({ type: "event" as const, occurrence, subject: subjectOf(occurrence.event.subjectId) })),
    ...dueToday.map((task) => ({ type: "task" as const, task, subject: subjectOf(task.subjectId) })),
  ].sort((a, b) => startOf(a) - startOf(b));

  return {
    now,
    agenda,
    upcoming: upcoming.map((task) => ({ task, subject: subjectOf(task.subjectId) })),
    subjects,
    nextStudySession: (() => {
      const next = ahead.find((o) => o.event.kind === "studiu" && !o.event.completedAt && o.end > now);
      return next ? { occurrence: next, subject: subjectOf(next.event.subjectId) } : null;
    })(),
  };
}

function startOf(item: AgendaItem) {
  return item.type === "event" ? item.occurrence.start.getTime() : new Date(item.task.dueAt).getTime();
}
