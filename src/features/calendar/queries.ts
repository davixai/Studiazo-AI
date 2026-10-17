import "server-only";
import type { CalendarEvent, EventOccurrence, Task } from "@/lib/contracts/domain";
import { isPreviewMode } from "@/lib/env";
import { previewEvents, previewTasks } from "@/lib/preview/fixtures";
import { createClient } from "@/lib/supabase/server";
import { EVENT_COLUMNS, TASK_COLUMNS, toEvent, toTask } from "@/lib/supabase/mappers";
import { expandEvents, type Range } from "@/lib/time/recurrence";

// Citiri comune ale calendarului. Proprietar: David.
// Folosite și de instrumentele AI (get_schedule, get_upcoming_deadlines, find_free_slots).
// RLS limitează rezultatele la utilizatorul autentificat; nu primesc niciodată un user_id ca parametru.

/** Aparițiile activităților care intersectează intervalul (recurența extinsă în ora locală). */
export async function getOccurrencesBetween(range: Range): Promise<EventOccurrence[]> {
  if (isPreviewMode()) return expandEvents(previewEvents(), range);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    // Activități unice din interval + toate cele recurente care au început înainte de sfârșitul lui.
    .or(
      `and(recurrence.eq.none,starts_at.lt.${range.end.toISOString()},ends_at.gt.${range.start.toISOString()}),and(recurrence.neq.none,starts_at.lt.${range.end.toISOString()})`,
    )
    .order("starts_at");

  if (error) throw new Error(`Nu am putut citi calendarul: ${error.message}`);
  return expandEvents((data ?? []).map(toEvent) as CalendarEvent[], range);
}

/** Teme și examene nefinalizate cu termen în interval. */
export async function getTasksBetween(range: Range, { includeCompleted = false } = {}): Promise<Task[]> {
  if (isPreviewMode()) {
    return previewTasks().filter((t) => {
      const due = new Date(t.dueAt);
      return due >= range.start && due < range.end && (includeCompleted || !t.completedAt);
    });
  }

  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .gte("due_at", range.start.toISOString())
    .lt("due_at", range.end.toISOString())
    .order("due_at");
  if (!includeCompleted) query = query.is("completed_at", null);

  const { data, error } = await query;
  if (error) throw new Error(`Nu am putut citi termenele: ${error.message}`);
  return (data ?? []).map(toTask);
}

/** Următoarele termene nefinalizate (de acum încolo), limitat. */
export async function getUpcomingTasks({ days = 30, limit = 8, now = new Date() } = {}): Promise<Task[]> {
  const tasks = await getTasksBetween({ start: now, end: new Date(now.getTime() + days * 86_400_000) });
  return tasks.slice(0, limit);
}
