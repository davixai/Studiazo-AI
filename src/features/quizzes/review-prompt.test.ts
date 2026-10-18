import { describe, expect, it } from "vitest";
import type { Quiz } from "@/lib/contracts/quiz";
import { reviewPrompt } from "./review-prompt";

const question = (id: string, topic: string, correctIndex: number, page: number | null = null) => ({
  id,
  topic,
  prompt: `Întrebarea ${id}?`,
  options: ["unu", "doi", "trei", "patru"],
  correctIndex,
  explanation: `Pentru că ${id}.`,
  source: { materialId: null, page },
});

const quiz = { title: "Derivate", questions: [question("a", "Reguli", 1, 12), question("b", "Limite", 2), question("c", "Reguli", 0)] } as unknown as Quiz;

describe("reviewPrompt", () => {
  it("pune greșelile cu varianta aleasă, cea corectă, explicația și pagina; nerăspunsul apare clar", () => {
    const text = reviewPrompt("Analiză", quiz, [0, 2, null]);
    expect(text).toContain("scor 1 din 3");
    expect(text).toContain("Întrebarea 1 (tema: Reguli, pagina 12 din curs)");
    expect(text).toContain("Studentul a ales: A\nCorect: B");
    expect(text).toContain("Explicația din test: Pentru că a.");
    expect(text).toContain("Studentul a ales: nu a răspuns");
    expect(text).toContain("<raspunsuri_corecte>\n- Limite: Întrebarea b?");
  });
});
