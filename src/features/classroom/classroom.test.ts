import { describe, expect, it } from "vitest";
import { courseNote, downloadPlan, dueInstant, filesFrom, sameName, taskKindFor, tasksFrom, unsupportedMessage } from "./mapping";

describe("dueInstant", () => {
  it("folosește ora UTC dată de Classroom", () => {
    expect(dueInstant({ year: 2026, month: 11, day: 3 }, { hours: 21, minutes: 59 })?.toISOString()).toBe("2026-11-03T21:59:00.000Z");
  });
  it("fără oră: sfârșitul zilei, ora României", () => {
    // 3 noiembrie: ora de iarnă (UTC+2)
    expect(dueInstant({ year: 2026, month: 11, day: 3 })?.toISOString()).toBe("2026-11-03T21:59:00.000Z");
  });
  it("fără dată: null", () => {
    expect(dueInstant(undefined, { hours: 10 })).toBeNull();
    expect(dueInstant({ year: 2026, month: 11 })).toBeNull();
  });
});

describe("taskKindFor", () => {
  it("recunoaște tipul din titlu, fără diacritice", () => {
    expect(taskKindFor("Examen final")).toBe("examen");
    expect(taskKindFor("Colocviu laborator")).toBe("colocviu");
    expect(taskKindFor("Test grilă 2")).toBe("test");
    expect(taskKindFor("Proiect echipă")).toBe("proiect");
    expect(taskKindFor("Exerciții capitolul 3")).toBe("tema");
  });
});

describe("tasksFrom", () => {
  const now = new Date("2026-10-17T12:00:00Z");
  it("păstrează temele cu termen, sare peste cele vechi și marchează predările", () => {
    const rows = tasksFrom(
      [
        { id: "a", title: "Tema 1", dueDate: { year: 2026, month: 10, day: 20 }, alternateLink: "https://classroom.google.com/x" },
        { id: "b", title: "Fără termen" },
        { id: "c", title: "Veche", dueDate: { year: 2026, month: 8, day: 1 } },
        { id: "d", title: "Predată", dueDate: { year: 2026, month: 10, day: 10 } },
      ],
      [{ courseWorkId: "d", state: "TURNED_IN" }],
      now,
    );
    expect(rows.map((r) => r.title)).toEqual(["Tema 1", "Predată"]);
    expect(rows[0].notes).toContain("https://classroom.google.com/x");
    expect(rows[0].completed_at).toBeNull();
    expect(rows[1].completed_at).toBe(now.toISOString());
  });
});

describe("filesFrom", () => {
  it("adună fișierele Drive fără duplicate", () => {
    const file = { driveFile: { driveFile: { id: "f1", title: "Curs 1.pdf" } } };
    const files = filesFrom([
      { from: "curs", items: [{ materials: [file, { link: { url: "https://x.ro" } }] }] },
      { from: "anunt", items: [{ materials: [file, { driveFile: { driveFile: { id: "f2", title: "Lab" } } }] }] },
    ]);
    expect(files).toEqual([
      { id: "f1", title: "Curs 1.pdf", from: "curs" },
      { id: "f2", title: "Lab", from: "anunt" },
    ]);
  });
});

describe("courseNote", () => {
  it("include anunțurile și linkurile; null când nu e nimic", () => {
    const note = courseNote(
      { id: "1", name: "Algebră" },
      [{ id: "a", text: "Colocviul se mută joi.", materials: [{ link: { url: "https://meet.google.com/x", title: "Meet" } }] }],
      [],
    );
    expect(note).toContain("Colocviul se mută joi.");
    expect(note).toContain("Meet: https://meet.google.com/x");
    expect(courseNote({ id: "1", name: "Algebră" }, [], [])).toBeNull();
  });
});

describe("downloadPlan", () => {
  it("PDF direct, documente Google exportate, Office sărit", () => {
    expect(downloadPlan("application/pdf")).toEqual({ kind: "pdf", export: false });
    expect(downloadPlan("application/vnd.google-apps.presentation")).toEqual({ kind: "pdf", export: true });
    expect(downloadPlan("image/jpeg")).toEqual({ kind: "image", export: false });
    expect(downloadPlan("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBeNull();
    expect(unsupportedMessage("Curs.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toContain("PDF");
  });
});

describe("sameName", () => {
  it("ignoră majusculele, spațiile și diacriticele", () => {
    expect(sameName("Analiză  Matematică", "analiza matematica")).toBe(true);
    expect(sameName("Fizică", "Chimie")).toBe(false);
  });
});
