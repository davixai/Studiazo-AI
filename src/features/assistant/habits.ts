import "server-only";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isoWeekday, toDateKey, toTimeOfDay } from "@/lib/time/zone";

// Ce învață asistentul din activitatea reală, nu din ce a declarat studentul: când chiar învață,
// cât durează sesiunile pe care le termină și câte din cele planificate duce la capăt. Nu se stochează nimic:
// se calculează la fiecare cerere din calendar (sesiunile de studiu) și din testele grilă rezolvate.

export const HABIT_DAYS = 30;
/** Sub atâtea momente de învățare nu tragem concluzii. */
const MIN_EVENTS = 3;

export type Moment = "dimineata" | "pranz" | "dupa_amiaza" | "seara" | "noaptea";

const MOMENT_TEXT: Record<Moment, string> = {
  dimineata: "dimineața",
  pranz: "la prânz",
  dupa_amiaza: "după-amiaza",
  seara: "seara",
  noaptea: "noaptea, după 23",
};
const WEEKDAYS = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];

export type StudySession = { start: Date; end: Date; completed: boolean };

export type StudyHabits = {
  planned: number;
  completed: number;
  quizzes: number;
  /** Momentul în care învață cel mai des și de câte ori, din totalul momentelor de învățare. */
  topMoment: { moment: Moment; count: number; of: number } | null;
  averageMinutes: number | null;
  /** Zilele săptămânii în care învață cel mai des (cel mult două). */
  topWeekdays: string[];
};

export function momentOf(instant: Date): Moment {
  const hour = Number(toTimeOfDay(instant).slice(0, 2));
  if (hour >= 5 && hour < 12) return "dimineata";
  if (hour >= 12 && hour < 15) return "pranz";
  if (hour >= 15 && hour < 19) return "dupa_amiaza";
  if (hour >= 19 && hour < 23) return "seara";
  return "noaptea";
}

/** Sesiunile trecute din calendar (terminate sau nu) și testele rezolvate, în obiceiuri. Null dacă sunt prea puține date. */
export function summarizeHabits(sessions: StudySession[], quizTimes: Date[]): StudyHabits | null {
  const done = sessions.filter((s) => s.completed);
  const moments = [...done.map((s) => s.start), ...quizTimes];
  if (moments.length < MIN_EVENTS) return null;

  const byMoment = new Map<Moment, number>();
  const byDay = new Map<number, number>();
  for (const m of moments) {
    byMoment.set(momentOf(m), (byMoment.get(momentOf(m)) ?? 0) + 1);
    const day = isoWeekday(toDateKey(m));
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const [moment, count] = [...byMoment].sort((a, b) => b[1] - a[1])[0]!;
  const days = [...byDay].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  // O zi „preferată” are măcar două momente și mai multe decât media; altfel nu e un tipar.
  const average = moments.length / 7;
  const topWeekdays = days.filter(([, n]) => n >= 2 && n > average).slice(0, 2).sort((a, b) => a[0] - b[0]).map(([d]) => WEEKDAYS[d - 1]!);
  const minutes = done.map((s) => (s.end.getTime() - s.start.getTime()) / 60_000);

  return {
    planned: sessions.length,
    completed: done.length,
    quizzes: quizTimes.length,
    topMoment: { moment, count, of: moments.length },
    averageMinutes: minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length / 5) * 5 : null,
    topWeekdays,
  };
}

/** Obiceiurile ca propoziții scurte: la persoana a treia pentru asistent, la a doua pentru student (Profil). */
export function describeHabits(h: StudyHabits, person: "el" | "tu" = "el"): string[] {
  const you = person === "tu";
  const parts: string[] = [];
  if (h.planned > 0) parts.push(`${you ? "ai terminat" : "a terminat"} ${h.completed} din ${h.planned} sesiuni de studiu planificate`);
  if (h.topMoment) parts.push(`${you ? "înveți" : "învață"} cel mai des ${MOMENT_TEXT[h.topMoment.moment]} (${h.topMoment.count} din ${h.topMoment.of} dăți)`);
  if (h.averageMinutes) parts.push(`o sesiune terminată durează în medie ${h.averageMinutes} de minute`);
  if (h.topWeekdays.length) parts.push(`${you ? "înveți" : "învață"} mai ales ${h.topWeekdays.join(" și ")}`);
  if (h.quizzes > 0) parts.push(h.quizzes === 1 ? `${you ? "ai rezolvat" : "a rezolvat"} un test grilă` : `${you ? "ai rezolvat" : "a rezolvat"} ${h.quizzes} teste grilă`);
  return parts;
}

export async function getStudyHabits(now = new Date()): Promise<StudyHabits | null> {
  if (isPreviewMode()) return null;
  const since = new Date(now.getTime() - HABIT_DAYS * 86_400_000).toISOString();
  const supabase = await createClient();
  const [sessions, attempts] = await Promise.all([
    supabase
      .from("events")
      .select("starts_at, ends_at, completed_at")
      .eq("kind", "studiu")
      .eq("recurrence", "none")
      .gte("starts_at", since)
      .lt("ends_at", now.toISOString()),
    supabase.from("quiz_attempts").select("completed_at").gte("completed_at", since),
  ]);
  if (sessions.error || attempts.error) return null;
  return summarizeHabits(
    (sessions.data ?? []).map((s) => ({ start: new Date(s.starts_at), end: new Date(s.ends_at), completed: s.completed_at !== null })),
    (attempts.data ?? []).map((a) => new Date(a.completed_at)),
  );
}
