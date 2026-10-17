import { describe, expect, it } from "vitest";
import { formatCount, formatRelativeTime } from "./format";
import { NOTE_CONTENT_MAX, NoteFormSchema, titleFromContent } from "./schemas";

describe("NoteFormSchema", () => {
  it("păstrează titlul dat și taie spațiile de la finalul conținutului", () => {
    expect(NoteFormSchema.parse({ title: "  Grafuri ", content: "BFS și DFS\n\n  " })).toEqual({
      title: "Grafuri",
      content: "BFS și DFS",
    });
  });

  it("păstrează indentarea de la începutul conținutului (cod, liste)", () => {
    expect(NoteFormSchema.parse({ title: "Cod", content: "  for i in range(3):" }).content).toBe("  for i in range(3):");
  });

  it("fără titlu, ia titlul din primul rând cu text", () => {
    expect(NoteFormSchema.parse({ title: "", content: "\n\n  Teorema lui Lagrange  \nenunț…" }).title).toBe(
      "Teorema lui Lagrange",
    );
  });

  it("respinge notița complet goală, cu mesaj pe conținut", () => {
    const r = NoteFormSchema.safeParse({ title: " ", content: " \n " });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["content"]);
  });

  it("acceptă exact 50.000 de caractere și respinge 50.001", () => {
    expect(NoteFormSchema.safeParse({ title: "x", content: "a".repeat(NOTE_CONTENT_MAX) }).success).toBe(true);
    expect(NoteFormSchema.safeParse({ title: "x", content: "a".repeat(NOTE_CONTENT_MAX + 1) }).success).toBe(false);
  });

  it("respinge titlul mai lung de 160 de caractere", () => {
    expect(NoteFormSchema.safeParse({ title: "t".repeat(161), content: "" }).success).toBe(false);
  });
});

describe("titleFromContent", () => {
  it("scurtează la un cuvânt întreg și adaugă „…”", () => {
    const t = titleFromContent("Aceasta este o propoziție foarte lungă despre structuri de date și algoritmi de sortare");
    expect(t.endsWith("…")).toBe(true);
    expect(t.length).toBeLessThanOrEqual(61);
    expect(t).not.toMatch(/\s…$/);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-10-17T12:00:00+03:00");
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const MIN = 60_000;
  const H = 60 * MIN;

  it("minute și ore, cu acordul corect", () => {
    expect(formatRelativeTime(ago(20_000), now)).toBe("chiar acum");
    expect(formatRelativeTime(ago(-5 * MIN), now)).toBe("chiar acum");
    expect(formatRelativeTime(ago(1 * MIN), now)).toBe("acum un minut");
    expect(formatRelativeTime(ago(5 * MIN), now)).toBe("acum 5 minute");
    expect(formatRelativeTime(ago(25 * MIN), now)).toBe("acum 25 de minute");
    expect(formatRelativeTime(ago(1 * H), now)).toBe("acum o oră");
    expect(formatRelativeTime(ago(3 * H), now)).toBe("acum 3 ore");
    expect(formatRelativeTime(ago(23 * H), now)).toBe("acum 23 de ore");
  });

  it("zile calendaristice locale, apoi data", () => {
    expect(formatRelativeTime(new Date("2026-10-16T09:00:00+03:00"), now)).toBe("ieri");
    expect(formatRelativeTime(new Date("2026-10-13T09:00:00+03:00"), now)).toBe("acum 4 zile");
    expect(formatRelativeTime(new Date("2026-10-03T09:00:00+03:00"), now)).toBe("3 oct.");
    expect(formatRelativeTime(new Date("2025-10-03T09:00:00+03:00"), now)).toBe("3 octombrie 2025");
  });

  it("în ziua de 25 de ore (25.10.2026) rămâne la ore în aceeași zi", () => {
    const end = new Date("2026-10-25T23:50:00+02:00");
    const start = new Date("2026-10-25T00:10:00+03:00"); // 24 h 40 min reale, aceeași dată locală
    expect(formatRelativeTime(start, end)).toBe("acum 24 de ore");
  });
});

describe("formatCount", () => {
  it("folosește separatorul de mii românesc", () => {
    expect(formatCount(50_000)).toBe("50.000");
    expect(formatCount(999)).toBe("999");
  });
});
