import "server-only";
import { isPreviewMode } from "@/lib/env";
import { previewLearningActivity } from "@/lib/preview/fixtures";
import { summarizeLearning, type LearningActivity, type LearningStats } from "@/lib/progress/streak";
import { createClient } from "@/lib/supabase/server";
import { APP_TIMEZONE, toDateKey } from "@/lib/time/zone";

// Proprietar: David. Surse reale: sesiuni de studiu finalizate (events) + teste rezolvate (quiz_attempts).
// Nimic nu se stochează separat; RLS limitează la utilizatorul curent.

const HISTORY_DAYS = 400;

export async function getLearningStats(now = new Date(), tz = APP_TIMEZONE): Promise<LearningStats> {
  const today = toDateKey(now, tz);
  if (isPreviewMode()) return summarizeLearning(previewLearningActivity(now), today);

  const since = new Date(now.getTime() - HISTORY_DAYS * 86_400_000).toISOString();
  const supabase = await createClient();
  const [sessions, attempts] = await Promise.all([
    supabase
      .from("events")
      .select("starts_at, ends_at")
      .eq("kind", "studiu")
      .eq("recurrence", "none")
      .not("completed_at", "is", null)
      .gte("starts_at", since),
    supabase.from("quiz_attempts").select("completed_at, duration_seconds").gte("completed_at", since),
  ]);
  if (sessions.error) throw new Error(`Nu am putut citi sesiunile: ${sessions.error.message}`);
  if (attempts.error) throw new Error(`Nu am putut citi testele: ${attempts.error.message}`);

  const activity: LearningActivity[] = [
    ...(sessions.data ?? []).map((s) => ({
      date: toDateKey(new Date(s.starts_at), tz),
      minutes: (Date.parse(s.ends_at) - Date.parse(s.starts_at)) / 60_000,
    })),
    ...(attempts.data ?? []).map((a) => ({
      date: toDateKey(new Date(a.completed_at), tz),
      minutes: (a.duration_seconds ?? 0) / 60,
    })),
  ];
  return summarizeLearning(activity, today);
}
