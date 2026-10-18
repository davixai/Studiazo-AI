import { describe, expect, it } from "vitest";
import { PREVIEW_QUIZ } from "@/lib/preview/fixtures";
import { generateReview } from "./review";

// Test cu OpenAI real (~0,1 cenți). Doar la cerere:
//   LIVE_AI=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run src/features/quizzes/review.live.test.ts

describe.skipIf(!process.env.LIVE_AI)("explicația greșelilor dintr-un test, cu OpenAI real", () => {
  it("explică în română fiecare greșeală", async () => {
    const wrong = PREVIEW_QUIZ.questions.map((q) => (q.correctIndex + 1) % 4);
    const { text, usage } = await generateReview({ subjectName: "Structuri de date", quiz: PREVIEW_QUIZ, answers: wrong, userId: "test" });
    console.log(usage, text);
    expect(text.length).toBeGreaterThan(200);
    expect(text).not.toMatch(/^#/m);
  }, 120_000);
});
