import { describe, expect, it } from "vitest";
import { scoreAttempt, weakTopics, type QuizQuestion } from "./quiz";

const q = (id: string, topic: string, correctIndex: number): QuizQuestion => ({
  id,
  prompt: "Întrebare",
  options: ["A", "B", "C", "D"],
  correctIndex,
  explanation: "Pentru că…",
  topic,
  source: { materialId: null, page: null },
});

describe("evaluarea testelor", () => {
  const questions = [q("1", "Limite", 0), q("2", "Limite", 1), q("3", "Derivate", 2), q("4", "Derivate", 3)];

  it("calculează scorul și rezultatul pe teme", () => {
    const result = scoreAttempt(questions, [0, 2, 2, null]);
    expect(result.score).toBe(2);
    expect(result.total).toBe(4);
    expect(result.breakdown).toEqual({ Limite: { correct: 1, total: 2 }, Derivate: { correct: 1, total: 2 } });
  });

  it("identifică temele slabe, de la cea mai slabă", () => {
    const { breakdown } = scoreAttempt([...questions, q("5", "Integrale", 0)], [0, 1, 0, 0, 1]);
    expect(weakTopics(breakdown).map((t) => t.topic)).toEqual(["Derivate", "Integrale"]);
  });
});
