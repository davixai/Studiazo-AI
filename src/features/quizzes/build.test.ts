import { describe, expect, it } from "vitest";
import { QuizSchema } from "@/lib/contracts/quiz";
import { buildQuiz } from "./build";

const MATERIAL = "11111111-1111-4111-8111-111111111111";
const excerpts = [
  { materialId: MATERIAL, title: "Curs 2", page: 7, text: "..." },
  { materialId: "notite", title: "Notiță: Recapitulare", page: 1, text: "..." },
];

const question = (overrides: Record<string, unknown> = {}) => ({
  prompt: "Ce complexitate are căutarea într-un arbore binar echilibrat?",
  options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
  correct_index: 1,
  explanation: "Înălțimea e logaritmică.",
  topic: "Arbori",
  source_index: 0,
  ...overrides,
});

describe("buildQuiz", () => {
  it("leagă sursa de pagina reală și produce un Quiz valid", () => {
    const quiz = buildQuiz({ title: "Arbori", questions: [question(), question({ source_index: 1 }), question({ source_index: null })] }, excerpts, 5);
    expect(QuizSchema.safeParse(quiz).success).toBe(true);
    expect(quiz.questions.map((q) => q.source)).toEqual([
      { materialId: MATERIAL, page: 7 },
      { materialId: null, page: null },
      { materialId: null, page: null },
    ]);
    expect(quiz.questions.map((q) => q.id)).toEqual(["q1", "q2", "q3"]);
  });

  it("aruncă întrebările stricate: variante lipsă sau dublate, index invalid, sursă inventată", () => {
    const quiz = buildQuiz(
      {
        title: "T",
        questions: [
          question({ options: ["a", "b", "c"] }),
          question({ options: ["a", "A", "b", "c"] }),
          question({ correct_index: 4 }),
          question({ source_index: 99 }),
        ],
      },
      excerpts,
      5,
    );
    expect(quiz.questions).toHaveLength(1);
    expect(quiz.questions[0].source).toEqual({ materialId: null, page: null });
  });

  it("amestecă variantele și mută corect indexul răspunsului", () => {
    const quiz = buildQuiz({ title: "T", questions: [question()] }, excerpts, 5, () => 0);
    const [q] = quiz.questions;
    expect(q.options).toEqual(["O(log n)", "O(n)", "O(n log n)", "O(1)"]);
    expect(q.options[q.correctIndex]).toBe("O(log n)");
  });

  it("respectă numărul cerut de întrebări", () => {
    const many = Array.from({ length: 8 }, () => question());
    expect(buildQuiz({ title: "T", questions: many }, excerpts, 5).questions).toHaveLength(5);
  });
});
