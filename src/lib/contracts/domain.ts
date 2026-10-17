// Tipuri de domeniu comune. Valorile enum trebuie să rămână identice cu migrațiile SQL.
// Proprietar: David. Schimbările se coordonează (vezi docs/CONTRACTS.md).

export const EVENT_KINDS = ["curs", "seminar", "laborator", "studiu", "job", "sport", "personal", "pauza"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const TASK_KINDS = ["tema", "proiect", "examen", "colocviu", "test", "altul"] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

export const RECURRENCE_KINDS = ["none", "weekly", "biweekly"] as const;
export type RecurrenceKind = (typeof RECURRENCE_KINDS)[number];

export const SUBJECT_COLORS = ["blue", "teal", "green", "amber", "rose", "violet", "slate"] as const;
export type SubjectColor = (typeof SUBJECT_COLORS)[number];

export const PREFERRED_TIMES = ["dimineata", "pranz", "dupa_amiaza", "seara", "fara_preferinta"] as const;
export type PreferredTime = (typeof PREFERRED_TIMES)[number];

export const MATERIAL_STATUSES = ["incarcat", "in_procesare", "procesat", "fara_text", "esuat"] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  curs: "Curs",
  seminar: "Seminar",
  laborator: "Laborator",
  studiu: "Studiu",
  job: "Job",
  sport: "Sport",
  personal: "Personal",
  pauza: "Pauză",
};

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  tema: "Temă",
  proiect: "Proiect",
  examen: "Examen",
  colocviu: "Colocviu",
  test: "Test",
  altul: "Altul",
};

export const RECURRENCE_LABELS: Record<RecurrenceKind, string> = {
  none: "O singură dată",
  weekly: "Săptămânal",
  biweekly: "La două săptămâni",
};

export const PREFERRED_TIME_LABELS: Record<PreferredTime, string> = {
  dimineata: "Dimineața",
  pranz: "La prânz",
  dupa_amiaza: "După-amiaza",
  seara: "Seara",
  fara_preferinta: "Nu contează",
};

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  incarcat: "Încărcat",
  in_procesare: "Se procesează",
  procesat: "Gata de folosit",
  fara_text: "Fără text selectabil",
  esuat: "Nu a putut fi procesat",
};

/** Intervale în care studentul poate învăța. weekday: 1 = luni … 7 = duminică (ISO). */
export type AvailabilityWindow = { weekday: number; start: string; end: string };

export type Profile = {
  id: string;
  fullName: string;
  university: string | null;
  faculty: string | null;
  specialization: string | null;
  studyYear: number | null;
  city: string;
  timezone: string;
  preferredTime: PreferredTime;
  sessionMinutes: number;
  dailyStudyLimitMinutes: number;
  availability: AvailabilityWindow[];
  onboardingCompletedAt: string | null;
};

export type Subject = {
  id: string;
  name: string;
  color: SubjectColor;
  professor: string | null;
};

/** Rând din `events` (prima apariție + regula de recurență). */
export type CalendarEvent = {
  id: string;
  subjectId: string | null;
  kind: EventKind;
  title: string;
  location: string | null;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  recurrence: RecurrenceKind;
  recurrenceUntil: string | null;
  excludedDates: string[];
  completedAt: string | null;
  proposalId: string | null;
};

/** O apariție concretă a unei activități, după extinderea recurenței. */
export type EventOccurrence = {
  event: CalendarEvent;
  /** Data locală (YYYY-MM-DD) a apariției, în fusul activității. */
  occurrenceDate: string;
  start: Date;
  end: Date;
};

export type Task = {
  id: string;
  subjectId: string | null;
  kind: TaskKind;
  title: string;
  notes: string | null;
  location: string | null;
  dueAt: string;
  durationMinutes: number | null;
  estimatedMinutes: number | null;
  completedAt: string | null;
};

/** Element afișat în agenda zilei (activitate sau termen). */
export type AgendaItem =
  | { type: "event"; occurrence: EventOccurrence; subject: Subject | null }
  | { type: "task"; task: Task; subject: Subject | null };
