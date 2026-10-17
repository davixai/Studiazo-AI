import { NOTES_SOURCE, type MaterialPage } from "@/features/assistant/material-context";
import type { Quiz, QuizQuestion } from "@/lib/contracts/quiz";

// Partea pură a generării: schema cerută modelului și transformarea răspunsului lui într-un Quiz valid.

export const QUIZ_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correct_index: { type: "integer" },
          explanation: { type: "string" },
          topic: { type: "string" },
          source_index: { type: ["integer", "null"] },
        },
        required: ["prompt", "options", "correct_index", "explanation", "topic", "source_index"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "questions"],
  additionalProperties: false,
} as const;

type RawQuestion = {
  prompt?: unknown;
  options?: unknown;
  correct_index?: unknown;
  explanation?: unknown;
  topic?: unknown;
  source_index?: unknown;
};

/**
 * Păstrează doar întrebările bine formate (4 variante diferite, index valid) și leagă sursa de pagina reală.
 * Un source_index inventat sau care arată spre o notiță devine „fără sursă”. Variantele se amestecă:
 * modelele tind să pună răspunsul corect primul.
 */
export function buildQuiz(
  raw: { title?: unknown; questions?: unknown },
  excerpts: MaterialPage[],
  maxQuestions: number,
  random: () => number = Math.random,
): Quiz {
  const questions: QuizQuestion[] = [];
  for (const q of (Array.isArray(raw.questions) ? raw.questions : []) as RawQuestion[]) {
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [];
    const correct = Number(q.correct_index);
    if (options.length !== 4 || new Set(options.map((o) => o.toLowerCase())).size !== 4) continue;
    if (!Number.isInteger(correct) || correct < 0 || correct > 3) continue;
    if (typeof q.prompt !== "string" || !q.prompt.trim() || typeof q.explanation !== "string" || !q.explanation.trim()) continue;

    const order = shuffle([0, 1, 2, 3], random);
    const excerpt = typeof q.source_index === "number" ? excerpts[q.source_index] : undefined;
    const fromPdf = excerpt && excerpt.materialId !== NOTES_SOURCE;
    questions.push({
      id: `q${questions.length + 1}`,
      prompt: q.prompt.trim().slice(0, 600),
      options: order.map((i) => options[i].slice(0, 300)),
      correctIndex: order.indexOf(correct),
      explanation: q.explanation.trim().slice(0, 800),
      topic: (typeof q.topic === "string" && q.topic.trim() ? q.topic.trim() : "General").slice(0, 80),
      source: { materialId: fromPdf ? excerpt.materialId : null, page: fromPdf ? excerpt.page : null },
    });
    if (questions.length >= maxQuestions) break;
  }
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim().slice(0, 160) : "Test grilă";
  return { title, questions };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
