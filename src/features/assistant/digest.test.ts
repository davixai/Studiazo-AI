import { describe, expect, it } from "vitest";
import { chunkPages } from "./digest";
import type { MaterialPage } from "./material-context";

const page = (materialId: string, page: number, text: string): MaterialPage => ({ materialId, title: `Curs ${materialId}`, page, text });

describe("chunkPages", () => {
  it("acoperă toate paginile, în ordine, fără să depășească limita", () => {
    const pages = Array.from({ length: 43 }, (_, i) => page("a", i + 1, "x".repeat(3_000)));
    const chunks = chunkPages(pages, 10_000);
    expect(chunks.map((c) => [c.fromPage, c.toPage])).toEqual(
      Array.from({ length: 15 }, (_, i) => [i * 3 + 1, Math.min(i * 3 + 3, 43)]),
    );
    expect(chunks.every((c) => c.text.length <= 10_000)).toBe(true);
  });

  it("nu amestecă materiale diferite într-o bucată și taie o pagină uriașă", () => {
    const chunks = chunkPages([page("a", 1, "unu"), page("b", 1, "doi"), page("b", 2, "y".repeat(50))], 30);
    expect(chunks.map((c) => [c.title, c.fromPage, c.toPage])).toEqual([
      ["Curs a", 1, 1],
      ["Curs b", 1, 1],
      ["Curs b", 2, 2],
    ]);
    expect(chunks[0].text).toBe("[pagina 1]\nunu");
  });
});
