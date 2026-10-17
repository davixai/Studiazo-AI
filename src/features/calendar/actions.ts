"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrorsFrom } from "@/features/auth/schemas";
import { requireUser } from "@/lib/auth/session";
import type { CalendarEvent } from "@/lib/contracts/domain";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatDayLong, formatTimeRange } from "@/lib/time/format";
import { expandEvent } from "@/lib/time/recurrence";
import { APP_TIMEZONE, fromLocal } from "@/lib/time/zone";
import { conflictRange, firstConflicts } from "./conflicts";
import { getOccurrencesBetween } from "./queries";
import {
  CompleteEventSchema,
  CompleteTaskSchema,
  DeleteEventSchema,
  EventFormSchema,
  IdSchema,
  TaskFormSchema,
  TIMED_TASK_KINDS,
  safeReturn,
  type ActionResult,
  type EventFormState,
  type TaskFormState,
} from "./schemas";

const PREVIEW_MESSAGE = "Modul previzualizare nu salvează date. Conectează Supabase pentru a salva activitatea.";
const MAX_CONFLICTS_SHOWN = 3;

function rawValues(formData: FormData) {
  return Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)]));
}

function done(returnTo?: string): never {
  revalidatePath("/calendar");
  revalidatePath("/azi");
  redirect(safeReturn(returnTo));
}

/** Creează sau modifică o activitate. La suprapunere întoarce un avertisment; „Salvează oricum” trimite allowOverlap=1. */
export async function saveEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  if (isPreviewMode()) return { status: "error", message: PREVIEW_MESSAGE };
  await requireUser();

  const values = rawValues(formData);
  const id = values.id ? z.uuid().safeParse(values.id) : null;
  if (id && !id.success) return { status: "error", message: "Activitatea nu mai există.", values };

  const parsed = EventFormSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  const v = parsed.data;

  const startsAt = fromLocal(v.date, v.startTime);
  const endsAt = fromLocal(v.date, v.endTime);
  if (endsAt <= startsAt) {
    return { status: "error", fieldErrors: { endTime: "Ora de sfârșit trebuie să fie după ora de început." }, values };
  }

  const eventId = id?.data ?? null;
  if (!v.allowOverlap) {
    const candidate: CalendarEvent = {
      id: eventId ?? "nou",
      subjectId: v.subjectId,
      kind: v.kind,
      title: v.title,
      location: v.location,
      notes: v.notes,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      timezone: APP_TIMEZONE,
      recurrence: v.recurrence,
      recurrenceUntil: v.recurrenceUntil,
      excludedDates: [],
      completedAt: null,
      proposalId: null,
    };
    const range = conflictRange(candidate);
    const others = (await getOccurrencesBetween(range)).filter((o) => o.event.id !== eventId);
    const conflicts = firstConflicts(expandEvent(candidate, range), others);
    if (conflicts.length > 0) {
      const shown = conflicts.slice(0, MAX_CONFLICTS_SHOWN).map((o) => `${o.event.title} · ${formatDayLong(o.start)}, ${formatTimeRange(o.start, o.end)}`);
      const rest = conflicts.length - shown.length;
      return {
        status: "warning",
        message: v.recurrence === "none" ? "Se suprapune cu:" : "Unele apariții se suprapun cu:",
        conflicts: rest > 0 ? [...shown, `și încă ${rest}`] : shown,
        values,
      };
    }
  }

  const columns = {
    kind: v.kind,
    title: v.title,
    subject_id: v.subjectId,
    location: v.location,
    notes: v.notes,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    timezone: APP_TIMEZONE,
    recurrence: v.recurrence,
    recurrence_until: v.recurrenceUntil,
  };

  const supabase = await createClient();
  const { data, error } = eventId
    ? await supabase.from("events").update(columns).eq("id", eventId).select("id")
    : await supabase.from("events").insert(columns).select("id");
  if (error) return { status: "error", message: "Nu am putut salva activitatea. Încearcă din nou.", values };
  if (!data?.length) return { status: "error", message: "Activitatea nu mai există.", values };

  done(values.returnTo);
}

/** Șterge toată seria sau doar o apariție (data se adaugă la excluded_dates). */
export async function deleteEvent(input: unknown): Promise<ActionResult> {
  if (isPreviewMode()) return { ok: false, message: PREVIEW_MESSAGE };
  await requireUser();

  const parsed = DeleteEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Nu am putut șterge activitatea." };
  const supabase = await createClient();

  if (parsed.data.scope === "occurrence") {
    const { data: row } = await supabase.from("events").select("excluded_dates").eq("id", parsed.data.id).maybeSingle();
    if (!row) return { ok: false, message: "Activitatea nu mai există." };
    const excluded = new Set<string>((row.excluded_dates as string[]) ?? []);
    excluded.add(parsed.data.date);
    const { error } = await supabase.from("events").update({ excluded_dates: [...excluded] }).eq("id", parsed.data.id);
    if (error) return { ok: false, message: "Nu am putut șterge apariția. Încearcă din nou." };
  } else {
    const { error } = await supabase.from("events").delete().eq("id", parsed.data.id);
    if (error) return { ok: false, message: "Nu am putut șterge activitatea. Încearcă din nou." };
  }

  done(parsed.data.returnTo);
}

/** Marchează o activitate unică drept finalizată (contează la streak dacă e o sesiune de studiu) sau o redeschide. */
export async function setEventCompleted(input: unknown): Promise<ActionResult> {
  if (isPreviewMode()) return { ok: false, message: PREVIEW_MESSAGE };
  await requireUser();

  const parsed = CompleteEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Nu am putut actualiza activitatea." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({ completed_at: parsed.data.completed ? new Date().toISOString() : null })
    .eq("id", parsed.data.id)
    .eq("recurrence", "none")
    .select("id");
  if (error || !data?.length) return { ok: false, message: "Nu am putut actualiza activitatea. Încearcă din nou." };

  done(parsed.data.returnTo);
}

/** Creează sau modifică o temă, un proiect sau un examen. */
export async function saveTask(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  if (isPreviewMode()) return { status: "error", message: PREVIEW_MESSAGE.replace("activitatea", "termenul") };
  await requireUser();

  const values = rawValues(formData);
  const id = values.id ? z.uuid().safeParse(values.id) : null;
  if (id && !id.success) return { status: "error", message: "Termenul nu mai există.", values };

  const parsed = TaskFormSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  const v = parsed.data;
  const timed = TIMED_TASK_KINDS.includes(v.kind);

  const columns = {
    kind: v.kind,
    title: v.title,
    subject_id: v.subjectId,
    location: timed ? v.location : null,
    notes: v.notes,
    due_at: fromLocal(v.date, v.time).toISOString(),
    duration_minutes: timed ? v.durationMinutes : null,
    estimated_minutes: v.estimatedMinutes,
  };

  const supabase = await createClient();
  const taskId = id?.data ?? null;
  const { data, error } = taskId
    ? await supabase.from("tasks").update(columns).eq("id", taskId).select("id")
    : await supabase.from("tasks").insert(columns).select("id");
  if (error) return { status: "error", message: "Nu am putut salva termenul. Încearcă din nou.", values };
  if (!data?.length) return { status: "error", message: "Termenul nu mai există.", values };

  done(values.returnTo);
}

export async function deleteTask(input: unknown): Promise<ActionResult> {
  if (isPreviewMode()) return { ok: false, message: PREVIEW_MESSAGE };
  await requireUser();

  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Nu am putut șterge termenul." };
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, message: "Nu am putut șterge termenul. Încearcă din nou." };

  done(parsed.data.returnTo);
}

/** Bifează un termen ca făcut (dispare din termenele viitoare) sau îl redeschide. */
export async function setTaskCompleted(input: unknown): Promise<ActionResult> {
  if (isPreviewMode()) return { ok: false, message: PREVIEW_MESSAGE };
  await requireUser();

  const parsed = CompleteTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Nu am putut actualiza termenul." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed_at: parsed.data.completed ? new Date().toISOString() : null })
    .eq("id", parsed.data.id)
    .select("id");
  if (error || !data?.length) return { ok: false, message: "Nu am putut actualiza termenul. Încearcă din nou." };

  done(parsed.data.returnTo);
}
