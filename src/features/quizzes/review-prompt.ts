import type { Quiz } from "@/lib/contracts/quiz";

const LETTERS = ["A", "B", "C", "D"];

/** Testul și răspunsurile studentului, ca text pentru model: întâi greșelile, cu tot contextul, apoi ce a știut. */
export function reviewPrompt(subjectName: string, quiz: Quiz, answers: Array<number | null>) {
  const wrong: string[] = [];
  const right: string[] = [];
  quiz.questions.forEach((q, i) => {
    const chosen = answers[i] ?? null;
    if (chosen === q.correctIndex) {
      right.push(`- ${q.topic}: ${q.prompt}`);
      return;
    }
    const options = q.options.map((o, j) => `   ${LETTERS[j]}. ${o}`).join("\n");
    wrong.push(
      [
        `Întrebarea ${i + 1} (tema: ${q.topic}${q.source.page ? `, pagina ${q.source.page} din curs` : ""})`,
        q.prompt,
        options,
        `Studentul a ales: ${chosen === null ? "nu a răspuns" : LETTERS[chosen]}`,
        `Corect: ${LETTERS[q.correctIndex]}`,
        `Explicația din test: ${q.explanation}`,
      ].join("\n"),
    );
  });
  const score = quiz.questions.length - wrong.length;
  return [
    `Materia: ${subjectName}`,
    `Testul: „${quiz.title}”, scor ${score} din ${quiz.questions.length}.`,
    "",
    "<greseli>",
    wrong.join("\n\n") || "(niciuna)",
    "</greseli>",
    "",
    "<raspunsuri_corecte>",
    right.join("\n") || "(niciunul)",
    "</raspunsuri_corecte>",
  ].join("\n");
}
