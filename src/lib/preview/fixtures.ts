import type { CalendarEvent, Profile, Subject, Task } from "@/lib/contracts/domain";
import { APP_TIMEZONE, fromLocal, shiftDateKey, startOfWeekKey, toDateKey } from "@/lib/time/zone";

// Date DEMONSTRATIVE pentru modul previzualizare (STUDIA_PREVIEW=1, fără Supabase).
// Interfața le etichetează vizibil. Nu se folosesc niciodată când Supabase este configurat.

export const PREVIEW_USER = { id: "00000000-0000-4000-8000-000000000001", email: "demo@studiazo.local" };

export const PREVIEW_PROFILE: Profile = {
  id: PREVIEW_USER.id,
  fullName: "Andrei Popescu",
  university: "Universitatea „Alexandru Ioan Cuza” din Iași",
  faculty: "Facultatea de Informatică",
  specialization: "Informatică",
  studyYear: 2,
  city: "Iași",
  timezone: APP_TIMEZONE,
  preferredTime: "seara",
  sessionMinutes: 50,
  dailyStudyLimitMinutes: 180,
  availability: [],
  onboardingCompletedAt: "2026-10-01T10:00:00+03:00",
};

export const PREVIEW_SUBJECTS: Subject[] = [
  { id: "00000000-0000-4000-8000-0000000000a1", name: "Structuri de date", color: "blue", professor: null },
  { id: "00000000-0000-4000-8000-0000000000a2", name: "Programare orientată pe obiecte", color: "violet", professor: null },
  { id: "00000000-0000-4000-8000-0000000000a3", name: "Probabilități și statistică", color: "teal", professor: null },
  { id: "00000000-0000-4000-8000-0000000000a4", name: "Baze de date", color: "amber", professor: null },
];

const [sd, poo, ps, bd] = PREVIEW_SUBJECTS;

function event(
  id: number,
  partial: Pick<CalendarEvent, "kind" | "title"> & Partial<CalendarEvent>,
  date: string,
  start: string,
  end: string,
): CalendarEvent {
  return {
    id: `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
    subjectId: null,
    location: null,
    notes: null,
    timezone: APP_TIMEZONE,
    recurrence: "none",
    recurrenceUntil: null,
    excludedDates: [],
    completedAt: null,
    proposalId: null,
    ...partial,
    startsAt: fromLocal(date, start).toISOString(),
    endsAt: fromLocal(date, end).toISOString(),
  };
}

export function previewEvents(now = new Date()): CalendarEvent[] {
  const today = toDateKey(now);
  const monday = startOfWeekKey(today);
  return [
    // Programul de azi (pentru ca pagina principală să aibă conținut în orice zi).
    event(101, { kind: "curs", title: "Structuri de date", subjectId: sd.id, location: "Sala C112" }, today, "08:00", "10:00"),
    event(102, { kind: "laborator", title: "Laborator POO", subjectId: poo.id, location: "Laborator C409" }, today, "12:00", "14:00"),
    event(103, { kind: "job", title: "Tură part-time" }, today, "16:00", "19:00"),
    event(104, { kind: "sport", title: "Sală" }, today, "20:00", "21:00"),
    // Orarul recurent al săptămânii.
    event(201, { kind: "curs", title: "Probabilități și statistică", subjectId: ps.id, location: "Amfiteatrul Pompeiu", recurrence: "weekly" }, monday, "10:00", "12:00"),
    event(202, { kind: "seminar", title: "Seminar baze de date", subjectId: bd.id, location: "Sala C210", recurrence: "weekly" }, shiftDateKey(monday, 1), "14:00", "16:00"),
    event(203, { kind: "curs", title: "Programare orientată pe obiecte", subjectId: poo.id, location: "Sala C2", recurrence: "weekly" }, shiftDateKey(monday, 2), "08:00", "10:00"),
    event(204, { kind: "laborator", title: "Laborator structuri de date", subjectId: sd.id, location: "Laborator C308", recurrence: "biweekly" }, shiftDateKey(monday, 3), "12:00", "14:00"),
  ];
}

export function previewTasks(now = new Date()): Task[] {
  const today = toDateKey(now);
  const task = (id: number, partial: Pick<Task, "kind" | "title"> & Partial<Task>, days: number, time: string): Task => ({
    id: `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
    subjectId: null,
    notes: null,
    location: null,
    durationMinutes: null,
    estimatedMinutes: null,
    completedAt: null,
    ...partial,
    dueAt: fromLocal(shiftDateKey(today, days), time).toISOString(),
  });
  return [
    task(301, { kind: "tema", title: "Tema 3 — liste înlănțuite", subjectId: sd.id }, 1, "23:59"),
    task(302, { kind: "examen", title: "Examen parțial", subjectId: ps.id, location: "Amfiteatrul Pompeiu", durationMinutes: 120 }, 6, "10:00"),
    task(303, { kind: "proiect", title: "Proiect — aplicație bibliotecă", subjectId: poo.id }, 12, "18:00"),
    task(304, { kind: "colocviu", title: "Colocviu SQL", subjectId: bd.id, durationMinutes: 90 }, 19, "12:00"),
  ];
}
