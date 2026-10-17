import "server-only";
import { QuizSchema, type Quiz, type QuizAttemptSummary, type TopicBreakdown } from "@/lib/contracts/quiz";
import { isPreviewMode } from "@/lib/env";
import { PREVIEW_QUIZ, PREVIEW_QUIZ_ID, PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import { createClient } from "@/lib/supabase/server";

// Proprietar: David. getRecentAttempts e citit de pagina Azi („Progres recent”) și de planificare (S8).

export type StoredQuiz = { id: string; subjectId: string; quiz: Quiz; createdAt: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getQuiz(id: string): Promise<StoredQuiz | null> {
  if (isPreviewMode()) {
    return id === PREVIEW_QUIZ_ID ? { id, subjectId: PREVIEW_SUBJECTS[0].id, quiz: PREVIEW_QUIZ, createdAt: new Date().toISOString() } : null;
  }
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("quizzes").select("id, subject_id, title, questions, created_at").eq("id", id).maybeSingle();
  if (error) throw new Error(`Nu am putut citi testul: ${error.message}`);
  if (!data) return null;
  const quiz = QuizSchema.safeParse({ title: data.title, questions: data.questions });
  return quiz.success ? { id: data.id as string, subjectId: data.subject_id as string, quiz: quiz.data, createdAt: data.created_at as string } : null;
}

/** Ultimele încercări, cu titlul testului și materia. */
export async function getRecentAttempts(limit = 5): Promise<QuizAttemptSummary[]> {
  if (isPreviewMode()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, score, total, topic_breakdown, duration_seconds, completed_at, quizzes(title, subject_id)")
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Nu am putut citi testele: ${error.message}`);

  return (data ?? []).map((r) => {
    const quiz = (Array.isArray(r.quizzes) ? r.quizzes[0] : r.quizzes) as { title?: string; subject_id?: string } | null;
    return {
      id: r.id as string,
      quizId: r.quiz_id as string,
      subjectId: quiz?.subject_id ?? "",
      quizTitle: quiz?.title ?? "Test grilă",
      score: r.score as number,
      total: r.total as number,
      topicBreakdown: (r.topic_breakdown ?? {}) as TopicBreakdown,
      durationSeconds: (r.duration_seconds as number | null) ?? null,
      completedAt: r.completed_at as string,
    };
  });
}
