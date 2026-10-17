import { z } from "zod";

// Contractul testelor grilă. Proprietar: Sergiu. Citit de David pentru „Progres recent” pe dashboard.

export const QuizQuestionSchema = z.object({
  id: z.string().min(1).max(20),
  prompt: z.string().trim().min(1).max(600),
  options: z.array(z.string().trim().min(1).max(300)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  /** De ce varianta corectă e corectă (și de ce celelalte nu). */
  explanation: z.string().trim().min(1).max(800),
  /** Capitolul/tema — folosit pentru a identifica unde greșește studentul. */
  topic: z.string().trim().min(1).max(80),
  /** Sursa din materiale, când există. */
  source: z.object({ materialId: z.uuid().nullable(), page: z.number().int().min(1).nullable() }),
});

export const QuizSchema = z.object({
  title: z.string().trim().min(1).max(160),
  questions: z.array(QuizQuestionSchema).min(3).max(10),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

/** Rezultatul pe teme al unei încercări: { "Limite": { correct: 1, total: 3 } } */
export type TopicBreakdown = Record<string, { correct: number; total: number }>;

/** Rezumat citit de dashboard (David) și de planificare (Sergiu). */
export type QuizAttemptSummary = {
  id: string;
  quizId: string;
  subjectId: string;
  quizTitle: string;
  score: number;
  total: number;
  topicBreakdown: TopicBreakdown;
  /** Durata rezolvării; intră în „timpul de învățare” (David, progres). */
  durationSeconds: number | null;
  completedAt: string;
};

export function scoreAttempt(questions: QuizQuestion[], answers: Array<number | null>) {
  const breakdown: TopicBreakdown = {};
  let score = 0;
  questions.forEach((q, i) => {
    const correct = answers[i] === q.correctIndex;
    if (correct) score++;
    const entry = (breakdown[q.topic] ??= { correct: 0, total: 0 });
    entry.total++;
    if (correct) entry.correct++;
  });
  return { score, total: questions.length, breakdown };
}

/** Temele cu rezultat sub prag, ordonate de la cea mai slabă. */
export function weakTopics(breakdown: TopicBreakdown, threshold = 0.6) {
  return Object.entries(breakdown)
    .map(([topic, { correct, total }]) => ({ topic, ratio: total > 0 ? correct / total : 0, correct, total }))
    .filter((t) => t.ratio < threshold)
    .sort((a, b) => a.ratio - b.ratio);
}
