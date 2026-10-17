import { describe, expect, it } from "vitest";
import { SCANNED_PDF_MESSAGE, classifyExtraction, normalizePageText, PAGE_TEXT_MAX } from "./extraction";
import { formatBytes, formatPages } from "./format";
import {
  checkFile,
  cleanTitle,
  hasJpegSignature,
  hasPdfSignature,
  MAX_FILE_BYTES,
  StartUploadSchema,
  titleFromFileName,
} from "./schemas";
import { normalizeForSearch, searchTerms, selectPages, type MaterialPage } from "./select-pages";
import { storagePathFor, thumbPathFor } from "./types";

describe("validarea fișierelor", () => {
  it("acceptă un PDF de până la 20 MB inclusiv", () => {
    expect(checkFile({ name: "curs.pdf", type: "application/pdf", size: MAX_FILE_BYTES }, "pdf")).toBeNull();
  });
  it("respinge 20 MB + 1 octet, fișierul gol și alt tip", () => {
    expect(checkFile({ name: "mare.pdf", type: "application/pdf", size: MAX_FILE_BYTES + 1 }, "pdf")).toMatch(/20 MB/);
    expect(checkFile({ name: "gol.pdf", type: "application/pdf", size: 0 }, "pdf")).toMatch(/gol/);
    expect(checkFile({ name: "curs.docx", type: "application/msword", size: 10 }, "pdf")).toMatch(/nu este PDF/);
  });
  it("acceptă PDF fără tip raportat, dacă are extensia .pdf (unele telefoane)", () => {
    expect(checkFile({ name: "Curs.PDF", type: "", size: 10 }, "pdf")).toBeNull();
  });
  it("schema de pe server respinge mărimile invalide", () => {
    const base = { subjectId: "6f1c2a52-3d4e-4b6a-9c1d-2e3f4a5b6c7d", kind: "pdf" };
    expect(StartUploadSchema.safeParse({ ...base, size: MAX_FILE_BYTES }).success).toBe(true);
    expect(StartUploadSchema.safeParse({ ...base, size: MAX_FILE_BYTES + 1 }).success).toBe(false);
    expect(StartUploadSchema.safeParse({ ...base, size: 0 }).success).toBe(false);
    expect(StartUploadSchema.safeParse({ ...base, size: 1.5 }).success).toBe(false);
  });
  it("recunoaște semnăturile PDF și JPEG", () => {
    expect(hasPdfSignature(new TextEncoder().encode("%PDF-1.7"))).toBe(true);
    expect(hasPdfSignature(new TextEncoder().encode("<html>"))).toBe(false);
    expect(hasJpegSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(hasJpegSignature(new Uint8Array([0x89, 0x50, 0x4e]))).toBe(false);
  });
});

describe("titluri și căi", () => {
  it("face un titlu lizibil din numele fișierului", () => {
    expect(titleFromFileName("Curs_03__grafuri.pdf")).toBe("Curs 03 grafuri");
    expect(titleFromFileName(".pdf")).toBe("Curs fără nume");
    expect(titleFromFileName("a".repeat(300) + ".pdf")).toHaveLength(160);
  });
  it("curăță titlul primit de la browser", () => {
    expect(cleanTitle("  Curs\u0000 1\n ", "x")).toBe("Curs 1");
    expect(cleanTitle("   ", "Rezervă")).toBe("Rezervă");
  });
  it("construiește calea din id-uri, cu utilizatorul primul (politica de Storage)", () => {
    const path = storagePathFor("u1", "s1", "m1", "image");
    expect(path).toBe("u1/s1/m1.jpg");
    expect(thumbPathFor(path)).toBe("u1/s1/m1.thumb.jpg");
    expect(storagePathFor("u1", "s1", "m1", "pdf")).toBe("u1/s1/m1.pdf");
  });
});

describe("formatare", () => {
  it("mărimi în unități binare, cu virgulă zecimală", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(850 * 1024)).toBe("850 KB");
    expect(formatBytes(3.24 * 1024 * 1024)).toBe("3,2 MB");
    expect(formatBytes(MAX_FILE_BYTES)).toBe("20 MB");
  });
  it("pagini cu acordul corect", () => {
    expect(formatPages(1)).toBe("1 pagină");
    expect(formatPages(24)).toBe("24 de pagini");
    expect(formatPages(12)).toBe("12 pagini");
  });
});

describe("extragerea textului", () => {
  it("curăță caracterele de control și comprimă spațiile", () => {
    expect(normalizePageText("  Arbori\u0000   binari \n\n\n\n  de căutare\t ")).toBe("Arbori binari\n\nde căutare");
    expect(normalizePageText("a".repeat(PAGE_TEXT_MAX + 10))).toHaveLength(PAGE_TEXT_MAX);
  });
  it("PDF cu text → procesat, cu paginile numerotate de la 1", () => {
    const r = classifyExtraction(["Introducere în grafuri și reprezentări.", "Parcurgerea în lățime (BFS) și adâncime."]);
    expect(r.status).toBe("procesat");
    expect(r.message).toBeNull();
    expect(r.pages.map((p) => p.page)).toEqual([1, 2]);
    expect(r.pageCount).toBe(2);
  });
  it("PDF scanat (fără text) → fara_text, cu mesajul clar", () => {
    const r = classifyExtraction(["", "  \n ", "12"]);
    expect(r).toMatchObject({ status: "fara_text", message: SCANNED_PDF_MESSAGE, pageCount: 3, pages: [] });
  });
  it("PDF parțial scanat → procesat, cu avertisment și fără paginile goale", () => {
    const text = "Teorema lui Lagrange pentru funcții derivabile pe un interval.";
    const r = classifyExtraction([text, "", text]);
    expect(r.status).toBe("procesat");
    expect(r.pages.map((p) => p.page)).toEqual([1, 3]);
    expect(r.message).toBe("1 pagină din 3 nu are text selectabil (probabil imagini scanate).");
    const many = classifyExtraction([text, "", "", ""]);
    expect(many.message).toBe("3 pagini din 4 nu au text selectabil (probabil imagini scanate).");
  });
  it("PDF fără pagini → esuat", () => {
    expect(classifyExtraction([]).status).toBe("esuat");
  });
});

describe("selectPages (pentru asistent)", () => {
  const pages: MaterialPage[] = [
    { materialId: "a", title: "Curs 1", page: 1, text: "Introducere: ce este un graf." },
    { materialId: "a", title: "Curs 1", page: 2, text: "Parcurgerea BFS folosește o coadă. BFS găsește drumuri minime." },
    { materialId: "b", title: "Curs 2", page: 1, text: "Ștergerea dintr-un arbore binar de căutare." },
  ];

  it("fără căutare: în ordinea citirii, în limita de caractere", () => {
    expect(selectPages(pages, { maxChars: 10_000 })).toHaveLength(3);
    const limited = selectPages(pages, { maxChars: pages[0].text.length + pages[1].text.length });
    expect(limited.map((p) => [p.materialId, p.page])).toEqual([["a", 1], ["a", 2]]);
  });

  it("cu căutare: doar paginile relevante, fără diacritice, rezultat în ordinea citirii", () => {
    expect(selectPages(pages, { query: "stergere arbore", maxChars: 10_000 }).map((p) => p.materialId)).toEqual(["b"]);
    const both = selectPages(pages, { query: "Ce este BFS? graf", maxChars: 10_000 });
    expect(both.map((p) => p.page)).toEqual([1, 2]);
  });

  it("nicio potrivire → listă goală", () => {
    expect(selectPages(pages, { query: "transformata Fourier", maxChars: 10_000 })).toEqual([]);
  });

  it("prioritizează pagina cea mai relevantă când nu încap toate", () => {
    const r = selectPages(pages, { query: "BFS graf", maxChars: pages[1].text.length });
    expect(r.map((p) => p.page)).toEqual([2]);
  });

  it("o singură pagină prea mare se scurtează exact la limită", () => {
    const r = selectPages([{ materialId: "x", title: "X", page: 1, text: "a".repeat(500) }], { maxChars: 120 });
    expect(r[0].text).toHaveLength(120);
  });

  it("limită zero sau listă goală → nimic", () => {
    expect(selectPages(pages, { maxChars: 0 })).toEqual([]);
    expect(selectPages([], { maxChars: 100 })).toEqual([]);
  });

  it("normalizează ș/ț cu virgulă și cu sedilă la fel", () => {
    expect(normalizeForSearch("Ștergere ţintă ș ț")).toBe("stergere tinta s t");
    expect(searchTerms("Explică-mi și BFS-ul, te rog")).toEqual(["bfs", "rog"]);
  });
});
