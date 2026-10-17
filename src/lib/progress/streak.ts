import { daysBetween, shiftDateKey } from "@/lib/time/zone";

// Progres și obicei: streak, insigne și timpul de învățare. Logică pură (fără DB), testată.
// O zi e „activă” dacă are cel puțin o activitate de învățare (sesiune finalizată sau test rezolvat).

export const BADGE_MILESTONES = [3, 7, 14, 30, 60, 100] as const;
export type BadgeMilestone = (typeof BADGE_MILESTONES)[number];

/** O activitate de învățare: ziua locală (YYYY-MM-DD) și minutele (0 dacă durata nu e cunoscută). */
export type LearningActivity = { date: string; minutes: number };

export type LearningStats = {
  /** Ultimele 7 zile, de la cea mai veche la azi. */
  last7Days: Array<{ date: string; minutes: number; active: boolean }>;
  weekMinutes: number;
  activeToday: boolean;
  /** Zile consecutive până azi (sau până ieri, dacă azi încă nu s-a învățat). */
  currentStreak: number;
  bestStreak: number;
  badges: Array<{ days: BadgeMilestone; unlocked: boolean }>;
  /** Următoarea insignă de atins cu streak-ul curent (null după ultima). */
  nextBadge: BadgeMilestone | null;
};

export function summarizeLearning(activity: LearningActivity[], today: string): LearningStats {
  const minutesByDay = new Map<string, number>();
  for (const a of activity) {
    if (a.date > today) continue;
    minutesByDay.set(a.date, (minutesByDay.get(a.date) ?? 0) + Math.max(0, Math.round(a.minutes)));
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDateKey(today, i - 6);
    return { date, minutes: minutesByDay.get(date) ?? 0, active: minutesByDay.has(date) };
  });

  const activeToday = minutesByDay.has(today);
  let currentStreak = 0;
  for (let day = activeToday ? today : shiftDateKey(today, -1); minutesByDay.has(day); day = shiftDateKey(day, -1)) {
    currentStreak++;
  }

  const days = [...minutesByDay.keys()].sort();
  let bestStreak = 0;
  let run = 0;
  days.forEach((day, i) => {
    run = i > 0 && daysBetween(days[i - 1], day) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
  });

  return {
    last7Days,
    weekMinutes: last7Days.reduce((sum, d) => sum + d.minutes, 0),
    activeToday,
    currentStreak,
    bestStreak,
    badges: BADGE_MILESTONES.map((days) => ({ days, unlocked: bestStreak >= days })),
    nextBadge: BADGE_MILESTONES.find((m) => m > currentStreak) ?? null,
  };
}
