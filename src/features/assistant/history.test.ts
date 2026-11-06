import { describe, expect, it } from "vitest";
import { proposalIdsOf, toHistory, type ProposalNote } from "./history";

describe("toHistory", () => {
  it("adaugă starea propunerii la răspunsul asistentului", () => {
    const notes = new Map<string, ProposalNote>([["p1", { status: "rejected", kind: "study_sessions", items: 4 }]]);
    const history = toHistory(
      [
        { role: "user", content: "Fă-mi un plan.", metadata: {} },
        { role: "assistant", content: "Ți-am pregătit o propunere mai jos.", metadata: { proposalIds: ["p1"] } },
      ],
      notes,
    );
    expect(history[0]).toEqual({ role: "user", content: "Fă-mi un plan." });
    expect(history[1]).toEqual({
      role: "assistant",
      content: "Ți-am pregătit o propunere mai jos.\n\n[Notă de la aplicație: în acest mesaj ai pregătit o propunere (4 sesiuni de studiu: studentul a refuzat-o (a apăsat «Renunță»)).]",
    });
  });

  it("lasă textul neschimbat când propunerea nu mai există", () => {
    const history = toHistory([{ role: "assistant", content: "Gata.", metadata: { proposalIds: ["sters"] } }], new Map());
    expect(history[0]).toEqual({ role: "assistant", content: "Gata." });
  });

  it("citește doar id-urile valide din metadata", () => {
    expect(proposalIdsOf({ proposalIds: ["a", 2, null, "b"] })).toEqual(["a", "b"]);
    expect(proposalIdsOf(null)).toEqual([]);
  });
});
