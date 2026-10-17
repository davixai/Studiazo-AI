import { describe, expect, it } from "vitest";
import { parseBlocks } from "./components/message-content";

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
