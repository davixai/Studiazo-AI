import { describe, expect, it } from "vitest";
import { generateQuiz } from "./generate";

// Test cu OpenAI real (~0,2 cenți). Doar la cerere:
//   LIVE_AI=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run src/features/quizzes/generate.live.test.ts

const MATERIAL = "11111111-1111-4111-8111-111111111111";
const pages = [
  {
    materialId: MATERIAL,
    title: "Curs 4 — Arbori",
    page: 3,
    text: "Un arbore binar de căutare (ABC) păstrează în subarborele stâng chei mai mici decât rădăcina și în cel drept chei mai mari. Căutarea pornește din rădăcină și coboară stânga/dreapta. Într-un ABC echilibrat înălțimea este O(log n), deci căutarea, inserarea și ștergerea sunt O(log n). Într-un ABC degenerat (cheile inserate deja sortate) arborele devine o listă și operațiile ajung la O(n). Parcurgerea în inordine (stânga, rădăcină, dreapta) listează cheile în ordine crescătoare.",
  },
];

describe.skipIf(!process.env.LIVE_AI)("generarea testelor, cu OpenAI real", () => {
  it("produce un test valid, legat de pagina din material", async () => {
    const { quiz, usage } = await generateQuiz({ subjectName: "Structuri de date", pages, focus: null, questionCount: 4, userId: "test" });
    console.log(usage, JSON.stringify(quiz, null, 1).slice(0, 1500));
    expect(quiz.questions.length).toBeGreaterThanOrEqual(3);
    expect(quiz.questions.some((q) => q.source.page === 3)).toBe(true);
  }, 120_000);
});
