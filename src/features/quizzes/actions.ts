"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { loadSubjectMaterial } from "@/features/assistant/materials";
import { listSubjects } from "@/features/subjects/queries";
import { describeAiError } from "@/lib/ai/client";
import { getAiConfig } from "@/lib/ai/config";
import { requireUser } from "@/lib/auth/session";
import { scoreAttempt, weakTopics, type TopicBreakdown } from "@/lib/contracts/quiz";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { generateQuiz } from "./generate";
import { getQuiz } from "./queries";

const CreateSchema = z.object({
  subjectId: z.uuid(),
  questionCount: z.number().int().min(3).max(10).default(5),
  focus: z.string().trim().max(200).nullable().default(null),
});

export type CreateQuizResult = { ok: true; quizId: string } | { ok: false; message: string };

/** Generează un test din materialele materiei (sau, fără materiale, din programa obișnuită) și îl salvează. */
export async function createQuiz(input: unknown): Promise<CreateQuizResult> {
  if (isPreviewMode()) return { ok: false, message: "Modul previzualizare nu generează teste. Conectează Supabase și cheia OpenAI." };
  const user = await requireUser();
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Cererea nu este validă." };

  const config = getAiConfig();
  if (!config.enabled) return { ok: false, message: "Asistentul AI nu este disponibil momentan." };

  const supabase = await createClient();
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", hourAgo);
  if ((count ?? 0) >= config.requestsPerHour) {
    return { ok: false, message: "Ai folosit asistentul de multe ori în ultima oră. Mai încearcă puțin mai târziu." };
  }

  const subject = (await listSubjects()).find((s) => s.id === parsed.data.subjectId);
  if (!subject) return { ok: false, message: "Materia nu mai există." };

  try {
    const generated = await generateQuiz({
      subjectName: subject.name,
      pages: await loadSubjectMaterial(subject.id),
      focus: parsed.data.focus,
      questionCount: parsed.data.questionCount,
      userId: user.id,
    });
    await supabase.from("ai_usage").insert({
      kind: "quiz",
      model: config.model,
      input_tokens: generated.usage.inputTokens,
      output_tokens: generated.usage.outputTokens,
    });

    const { quiz } = generated;
    const materialIds = [...new Set(quiz.questions.map((q) => q.source.materialId).filter((id): id is string => id !== null))];
    const { data, error } = await supabase
      .from("quizzes")
      .insert({ subject_id: subject.id, title: quiz.title, questions: quiz.questions, material_ids: materialIds })
      .select("id")
      .single();
    if (error || !data) return { ok: false, message: "Nu am putut salva testul. Încearcă din nou." };
    return { ok: true, quizId: data.id as string };
  } catch (error) {
    await supabase.from("ai_usage").insert({ kind: "quiz", model: config.model, ok: false });
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return { ok: false, message: "Testul generat nu a ieșit bine. Încearcă din nou." };
    }
    return { ok: false, message: describeAiError(error).message };
  }
}

const SubmitSchema = z.object({
  quizId: z.uuid(),
  answers: z.array(z.number().int().min(0).max(3).nullable()).max(10),
  durationSeconds: z.number().int().min(0).max(86_400),
});

export type SubmitAttemptResult =
  | { ok: true; score: number; total: number; breakdown: TopicBreakdown; weak: string[] }
  | { ok: false; message: string };

/** Salvează o încercare. Scorul se calculează pe server din testul salvat, nu se ia de la client. */
export async function submitAttempt(input: unknown): Promise<SubmitAttemptResult> {
  await requireUser();
  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Răspunsurile nu sunt valide." };

  const stored = await getQuiz(parsed.data.quizId);
  if (!stored) return { ok: false, message: "Testul nu mai există." };
  const answers = stored.quiz.questions.map((_, i) => parsed.data.answers[i] ?? null);
  const { score, total, breakdown } = scoreAttempt(stored.quiz.questions, answers);
  const weak = weakTopics(breakdown).map((t) => t.topic);
  // Previzualizare: arătăm rezultatul, fără să salvăm nimic.
  if (isPreviewMode()) return { ok: true, score, total, breakdown, weak };

  const supabase = await createClient();
  const { error } = await supabase.from("quiz_attempts").insert({
    quiz_id: stored.id,
    answers,
    score,
    total,
    topic_breakdown: breakdown,
    duration_seconds: parsed.data.durationSeconds,
  });
  if (error) return { ok: false, message: "Nu am putut salva rezultatul. Încearcă din nou." };

  revalidatePath("/azi");
  return { ok: true, score, total, breakdown, weak };
}
