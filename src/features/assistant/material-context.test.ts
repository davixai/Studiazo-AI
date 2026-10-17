import { describe, expect, it } from "vitest";
import { normalize, pickPages, type MaterialPage } from "./material-context";

const page = (page: number, text: string): MaterialPage => ({ materialId: "m1", title: "Curs 3", page, text });
const PAGES = [page(1, "Introducere în grafuri."), page(2, "Arbori binari de căutare: inserare, ștergere."), page(3, "Parcurgerea arborilor în lățime.")];

describe("pickPages", () => {
  it("găsește paginile care conțin termenii, indiferent de diacritice și majuscule", () => {
    expect(pickPages(PAGES, "Ce e un arbore binar? ARBORI binari", 10_000).map((p) => p.page)).toEqual([2, 3]);
    expect(pickPages(PAGES, "CĂUTARE", 10_000).map((p) => p.page)).toEqual([2]);
    expect(normalize("Ștergere țărm")).toBe("stergere tarm");
  });

  it("fără întrebare sau fără potriviri întoarce paginile în ordine", () => {
    expect(pickPages(PAGES, null, 10_000).map((p) => p.page)).toEqual([1, 2, 3]);
    expect(pickPages(PAGES, "fotosinteza", 10_000).map((p) => p.page)).toEqual([1, 2, 3]);
  });

  it("respectă limita de caractere și taie o pagină prea mare", () => {
    expect(pickPages(PAGES, null, 50).map((p) => p.page)).toEqual([1]);
    expect(pickPages([page(1, "x".repeat(100))], null, 30)[0].text).toHaveLength(30);
  });
});
