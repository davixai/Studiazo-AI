import { describe, expect, it } from "vitest";
import { parseBlocks, plainMath } from "./components/message-content";

describe("parseBlocks", () => {
  it("împarte în paragrafe și liste", () => {
    const blocks = parseBlocks("Salut!\nIată pașii:\n\n1. Citește\n2. Rezolvă\n\n- unu\n- doi\n\nGata.");
    expect(blocks.map((b) => b.type)).toEqual(["p", "ol", "ul", "p"]);
    expect(blocks[1]).toEqual({ type: "ol", items: ["Citește", "Rezolvă"] });
  });

  it("păstrează blocurile de cod întregi", () => {
    expect(parseBlocks("```\nint x = 1;\n\nx++;\n```")).toEqual([{ type: "code", text: "int x = 1;\n\nx++;" }]);
  });

  it("transformă titlurile în text îngroșat", () => {
    expect(parseBlocks("## Recapitulare")).toEqual([{ type: "p", lines: ["**Recapitulare**"] }]);
  });
});

describe("plainMath", () => {
  it("transformă LaTeX-ul uzual în text cu simboluri", () => {
    expect(plainMath("Ce obții pentru \\(2\\times x\\)?")).toBe("Ce obții pentru 2× x?");
    expect(plainMath("$\\frac{a}{b} \\le \\sqrt{x}$")).toBe("(a)/(b) ≤ √(x)");
  });

  it("se aplică în text, dar nu în blocurile de cod", () => {
    expect(parseBlocks("Avem \\(x^{2}\\).\n```\necho $HOME $PATH\n```")).toEqual([
      { type: "p", lines: ["Avem x^(2)."] },
      { type: "code", text: "echo $HOME $PATH" },
    ]);
  });
});
