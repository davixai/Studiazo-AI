import type {
  AvailabilityWindow,
  CalendarEvent,
  EventKind,
  PreferredTime,
  Profile,
  RecurrenceKind,
  Subject,
  SubjectColor,
  Task,
  TaskKind,
} from "@/lib/contracts/domain";
import { ProposalPayloadSchema, type Proposal, type ProposalStatus } from "@/lib/contracts/proposals";

// Conversii rând SQL (snake_case) → tip de domeniu (camelCase). Coloanele selectate sunt exportate
// ca liste, ca toate interogările să ceară exact câmpurile mapate aici.

type Row = Record<string, unknown>;

export const PROFILE_COLUMNS =
  "id, full_name, university, faculty, specialization, study_year, city, timezone, preferred_time, session_minutes, daily_study_limit_minutes, availability, onboarding_completed_at";

export const SUBJECT_COLUMNS = "id, name, color, professor";

export const EVENT_COLUMNS =
  "id, subject_id, kind, title, location, notes, starts_at, ends_at, timezone, recurrence, recurrence_until, excluded_dates, completed_at, proposal_id";

export const TASK_COLUMNS =
  "id, subject_id, kind, title, notes, location, due_at, duration_minutes, estimated_minutes, completed_at";

export function toProfile(r: Row): Profile {
  return {
    id: r.id as string,
    fullName: (r.full_name as string) ?? "",
    university: (r.university as string | null) ?? null,
    faculty: (r.faculty as string | null) ?? null,
    specialization: (r.specialization as string | null) ?? null,
    studyYear: (r.study_year as number | null) ?? null,
    city: (r.city as string) ?? "Iași",
    timezone: (r.timezone as string) ?? "Europe/Bucharest",
    preferredTime: r.preferred_time as PreferredTime,
    sessionMinutes: r.session_minutes as number,
    dailyStudyLimitMinutes: r.daily_study_limit_minutes as number,
    availability: (r.availability as AvailabilityWindow[]) ?? [],
    onboardingCompletedAt: (r.onboarding_completed_at as string | null) ?? null,
  };
}

export function toSubject(r: Row): Subject {
  return {
    id: r.id as string,
    name: r.name as string,
    color: r.color as SubjectColor,
    professor: (r.professor as string | null) ?? null,
  };
}

export function toEvent(r: Row): CalendarEvent {
  return {
    id: r.id as string,
    subjectId: (r.subject_id as string | null) ?? null,
    kind: r.kind as EventKind,
    title: r.title as string,
    location: (r.location as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    startsAt: r.starts_at as string,
    endsAt: r.ends_at as string,
    timezone: r.timezone as string,
    recurrence: r.recurrence as RecurrenceKind,
    recurrenceUntil: (r.recurrence_until as string | null) ?? null,
    excludedDates: (r.excluded_dates as string[]) ?? [],
    completedAt: (r.completed_at as string | null) ?? null,
    proposalId: (r.proposal_id as string | null) ?? null,
  };
}

export function toTask(r: Row): Task {
  return {
    id: r.id as string,
    subjectId: (r.subject_id as string | null) ?? null,
    kind: r.kind as TaskKind,
    title: r.title as string,
    notes: (r.notes as string | null) ?? null,
    location: (r.location as string | null) ?? null,
    dueAt: r.due_at as string,
    durationMinutes: (r.duration_minutes as number | null) ?? null,
    estimatedMinutes: (r.estimated_minutes as number | null) ?? null,
    completedAt: (r.completed_at as string | null) ?? null,
  };
}

export const PROPOSAL_COLUMNS = "id, conversation_id, status, payload, created_at, expires_at";

/** Propunerile cu payload invalid (ex. modificat manual) nu se afișează: întoarce null. */
export function toProposal(r: Row): Proposal | null {
  const payload = ProposalPayloadSchema.safeParse(r.payload);
  if (!payload.success) return null;
  return {
    id: r.id as string,
    conversationId: (r.conversation_id as string | null) ?? null,
    status: r.status as ProposalStatus,
    payload: payload.data,
    createdAt: r.created_at as string,
    expiresAt: r.expires_at as string,
  };
}
