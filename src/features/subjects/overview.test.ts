import { describe, expect, it } from "vitest";
import type { Subject } from "@/lib/contracts/domain";
import { buildOverview, contentBars, percent, studiedShare, subjectInitials, type OverviewMaterial } from "./overview";

const sd: Subject = { id: "s1", name: "Structuri de date", color: "blue", professor: null };
const poo: Subject = { id: "s2", name: "POO", color: "violet", professor: null };

const pdf = (id: string, subjectId: string, extra: Partial<OverviewMaterial> = {}): OverviewMaterial => ({
  id,
  subjectId,
  title: id,
  kind: "pdf",
  status: "procesat",
  studied: false,
  pageCount: 10,
  createdAt: "2026-10-10T10:00:00Z",
  ...extra,
});

describe("buildOverview", () => {
  const overview = buildOverview(
    [sd, poo],
    [
      pdf("a", "s1", { studied: true, pageCount: 24 }),
      pdf("b", "s1", { status: "fara_text", pageCount: 6 }), // scanat: paginile nu sunt „gata”
      pdf("c", "s1", { status: "esuat", pageCount: null, studied: true }),
      pdf("p", "s1", { kind: "image", pageCount: null, studied: true, createdAt: "2026-10-12T10:00:00Z" }), // poza nu e „parcursă”
      pdf("z", "arhivata", { createdAt: "2026-10-16T10:00:00Z" }), // materie arhivată: ignorată
    ],
    [
      { id: "n1", subjectId: "s2", title: "Moștenire", updatedAt: "2026-10-15T10:00:00Z" },
      { id: "n2", subjectId: "arhivata", title: "x", updatedAt: "2026-10-17T10:00:00Z" },
    ],
  );

  it("numără pe materii, doar PDF-urile intră la „parcurs” și la pagini gata", () => {
    const s1 = overview.subjects[0];
    expect(s1).toMatchObject({ pdfCount: 3, photoCount: 1, noteCount: 0, studiedCount: 2, readyPages: 24, readyPdfs: 1 });
    expect(overview.subjects[1]).toMatchObject({ pdfCount: 0, noteCount: 1 });
  });

  it("totalurile sunt suma materiilor active", () => {
    expect(overview.totals).toEqual({ subjects: 2, pdfs: 3, photos: 1, notes: 1, studied: 2, readyPages: 24, readyPdfs: 1, subjectsWithContent: 2 });
    expect(overview.materialDates).toHaveLength(4); // fără materia arhivată
    expect(overview.noteDates).toEqual(["2026-10-15T10:00:00Z"]);
  });

  it("„adăugate recent”: cele mai noi primele, fără materii arhivate", () => {
    expect(overview.recent.map((r) => r.id)).toEqual(["n1", "p", "a", "b", "c"]);
    expect(overview.recent[0]).toMatchObject({ kind: "note", subject: poo });
  });
});

describe("procente", () => {
  it("fără PDF-uri nu există procent; altfel între 0 și 1", () => {
    expect(studiedShare(0, 0)).toBeNull();
    expect(studiedShare(1, 4)).toBe(0.25);
    expect(studiedShare(5, 4)).toBe(1);
  });
  it("rotunjire: progresul mic nu pare zero", () => {
    expect(percent(0)).toBe(0);
    expect(percent(0.004)).toBe(1);
    expect(percent(0.666)).toBe(67);
    expect(percent(1)).toBe(100);
  });
});

describe("contentBars", () => {
  it("ordonează descrescător, prima bară e întreagă, materiile goale la final cu zero", () => {
    const fiz: Subject = { id: "s3", name: "Fizică", color: "teal", professor: null };
    const { subjects } = buildOverview([sd, poo, fiz], [pdf("a", "s1"), pdf("b", "s1"), pdf("c", "s1"), pdf("d", "s2")], []);
    const bars = contentBars(subjects);
    expect(bars.map((b) => [b.subject.id, b.value, b.share])).toEqual([
      ["s1", 3, 1],
      ["s2", 1, 1 / 3],
      ["s3", 0, 0],
    ]);
    expect(contentBars(subjects, 2)).toHaveLength(2);
    expect(contentBars(buildOverview([sd], [], []).subjects)).toEqual([]);
  });
});

describe("subjectInitials", () => {
  it("ia inițialele cuvintelor importante", () => {
    expect(subjectInitials("Structuri de date")).toBe("SD");
    expect(subjectInitials("Programare orientată pe obiecte")).toBe("PO");
    expect(subjectInitials("Fizică")).toBe("FI");
    expect(subjectInitials("științe")).toBe("ȘT");
    expect(subjectInitials("  ")).toBe("?");
  });
});
