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
import { generateReview } from "./review";
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
  | { ok: true; score: number; total: number; breakdown: TopicBreakdown; weak: string[]; attemptId: string | null }
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
  if (isPreviewMode()) return { ok: true, score, total, breakdown, weak, attemptId: null };

  const supabase = await createClient();
  const { data: saved, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: stored.id,
      answers,
      score,
      total,
      topic_breakdown: breakdown,
      duration_seconds: parsed.data.durationSeconds,
    })
    .select("id")
    .single();
  if (error || !saved) return { ok: false, message: "Nu am putut salva rezultatul. Încearcă din nou." };

  revalidatePath("/azi");
  return { ok: true, score, total, breakdown, weak, attemptId: saved.id as string };
}

export type ExplainAttemptResult = { ok: true; text: string; href: string } | { ok: false; message: string };

/**
 * Explicația AI a greșelilor dintr-o încercare. Se salvează ca o conversație proprie în chatul materiei
 * („Test: … · 3/5”), deci rămâne în istoricul materiei. A doua cerere pentru aceeași încercare o refolosește.
 */
export async function explainAttempt(input: unknown): Promise<ExplainAttemptResult> {
  if (isPreviewMode()) return { ok: false, message: "Modul previzualizare nu folosește asistentul. Conectează Supabase și cheia OpenAI." };
  const user = await requireUser();
  const parsed = z.object({ attemptId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Rezultatul testului nu mai există." };
  const { attemptId } = parsed.data;

  const supabase = await createClient();
  const { data: attempt } = await supabase.from("quiz_attempts").select("id, quiz_id, answers, score, total").eq("id", attemptId).maybeSingle();
  if (!attempt) return { ok: false, message: "Rezultatul testului nu mai există." };
  const stored = await getQuiz(attempt.quiz_id as string);
  if (!stored) return { ok: false, message: "Testul nu mai există." };
  const chatHref = (conversationId: string) => `/asistent?materie=${stored.subjectId}&conversatie=${conversationId}`;

  const { data: existing } = await supabase
    .from("messages")
    .select("content, conversation_id")
    .eq("role", "assistant")
    .eq("metadata->>reviewOf", attemptId)
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, text: existing.content as string, href: chatHref(existing.conversation_id as string) };

  const config = getAiConfig();
  if (!config.enabled) return { ok: false, message: "Asistentul AI nu este disponibil momentan." };
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", hourAgo);
  if ((count ?? 0) >= config.requestsPerHour) {
    return { ok: false, message: "Ai folosit asistentul de multe ori în ultima oră. Mai încearcă puțin mai târziu." };
  }

  const subject = (await listSubjects()).find((s) => s.id === stored.subjectId);
  const answers = (Array.isArray(attempt.answers) ? attempt.answers : []) as Array<number | null>;
  let review;
  try {
    review = await generateReview({ subjectName: subject?.name ?? "Materie", quiz: stored.quiz, answers, userId: user.id });
  } catch (error) {
    await supabase.from("ai_usage").insert({ kind: "chat", model: config.model, ok: false });
    return { ok: false, message: describeAiError(error).message };
  }
  await supabase.from("ai_usage").insert({
    kind: "chat",
    model: config.model,
    input_tokens: review.usage.inputTokens,
    output_tokens: review.usage.outputTokens,
  });
  if (!review.text) return { ok: false, message: "Explicația nu a ieșit bine. Încearcă din nou." };

  const score = `${attempt.score}/${attempt.total}`;
  const { data: conversation } = await supabase
    .from("conversations")
    .insert({ subject_id: stored.subjectId, title: `Test: ${stored.quiz.title} · ${score}`.slice(0, 80) })
    .select("id")
    .single();
  if (!conversation) return { ok: false, message: "Nu am putut salva explicația. Încearcă din nou." };

  // Ore explicite: ambele rânduri se inserează în aceeași tranzacție și ar avea același now().
  const answeredAt = Date.now();
  const { error } = await supabase.from("messages").insert([
    {
      conversation_id: conversation.id,
      role: "user",
      content: `Explică-mi ce n-a mers bine la testul „${stored.quiz.title}”. Am avut ${attempt.score} din ${attempt.total} corecte.`,
      metadata: { quizId: stored.id },
      created_at: new Date(answeredAt - 1).toISOString(),
    },
    {
      conversation_id: conversation.id,
      role: "assistant",
      content: review.text.slice(0, 20_000),
      metadata: { reviewOf: attemptId, quizId: stored.id },
      created_at: new Date(answeredAt).toISOString(),
    },
  ]);
  if (error) {
    // Fără conversații goale în istoric.
    await supabase.from("conversations").delete().eq("id", conversation.id);
    return { ok: false, message: "Nu am putut salva explicația. Încearcă din nou." };
  }

  revalidatePath("/asistent");
  return { ok: true, text: review.text, href: chatHref(conversation.id as string) };
}
