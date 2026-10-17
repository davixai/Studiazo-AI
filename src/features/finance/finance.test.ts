import { describe, expect, it } from "vitest";
import { buildAdvicePrompt, splitAdvice } from "./advice-prompt";
import { EntryFormSchema, parseAmount } from "./schemas";
import { extraIncomeNeeded, monthLabel, shiftMonth, summarize, trend, type FinanceEntry } from "./stats";

const entry = (kind: FinanceEntry["kind"], category: string, amount: number, month = "2026-10", note: string | null = null): FinanceEntry => ({
  id: `${kind}-${category}-${amount}-${month}`,
  kind,
  category,
  amount,
  note,
  month,
});

const october = [
  entry("venit", "bursa", 1000),
  entry("venit", "parinti", 1000),
  entry("cheltuiala", "chirie", 800),
  entry("cheltuiala", "mancare", 400),
  entry("cheltuiala", "iesiri", 300),
  entry("cheltuiala", "mancare", 100),
];

describe("summarize", () => {
  it("calculează totalurile, categoriile sortate și regula 50/30/20", () => {
    const s = summarize(october);
    expect(s.income).toBe(2000);
    expect(s.expenses).toBe(1600);
    expect(s.balance).toBe(400);
    expect(s.savingsRate).toBeCloseTo(0.2);
    expect(s.expensesByCategory.map((c) => c.category)).toEqual(["chirie", "mancare", "iesiri"]);
    expect(s.expensesByCategory[1].amount).toBe(500);
    expect(s.rule).toEqual({ nevoi: 0.65, dorinte: 0.15, economii: 0.2 });
  });

  it("fără venit nu calculează rate", () => {
    const s = summarize([entry("cheltuiala", "mancare", 100)]);
    expect(s.savingsRate).toBeNull();
    expect(s.rule).toBeNull();
    expect(s.balance).toBe(-100);
  });
});

describe("extraIncomeNeeded", () => {
  it("deficit, sub 20% economii, buget sănătos", () => {
    expect(extraIncomeNeeded(summarize([entry("venit", "job", 1000), entry("cheltuiala", "chirie", 1300)]))).toBe(300);
    expect(extraIncomeNeeded(summarize([entry("venit", "job", 1000), entry("cheltuiala", "chirie", 900)]))).toBe(100);
    expect(extraIncomeNeeded(summarize(october))).toBe(0);
  });
});

describe("luni", () => {
  it("trece corect peste ani", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(monthLabel("2026-10")).toBe("Octombrie 2026");
  });

  it("trendul are mereu 6 luni, cu zero unde lipsesc date", () => {
    const t = trend([...october, entry("cheltuiala", "chirie", 700, "2026-08")], "2026-10");
    expect(t.map((p) => p.month)).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(t[3]).toEqual({ month: "2026-08", income: 0, expenses: 700 });
    expect(t[5].income).toBe(2000);
  });
});

describe("parseAmount și formularul", () => {
  it("acceptă formatele românești", () => {
    expect(parseAmount("1.250,50")).toBe(1250.5);
    expect(parseAmount("1250.5")).toBe(1250.5);
    expect(parseAmount("1 250 lei")).toBe(1250);
    expect(parseAmount("12,5")).toBe(12.5);
  });

  it("respinge o categorie de cheltuială pusă la venit și sumele invalide", () => {
    expect(EntryFormSchema.safeParse({ kind: "venit", category: "chirie", amount: "100", note: "", month: "2026-10" }).success).toBe(false);
    expect(EntryFormSchema.safeParse({ kind: "cheltuiala", category: "chirie", amount: "-5", note: "", month: "2026-10" }).success).toBe(false);
    expect(EntryFormSchema.safeParse({ kind: "cheltuiala", category: "chirie", amount: "abc", note: "", month: "2026-10" }).success).toBe(false);
    const ok = EntryFormSchema.safeParse({ kind: "cheltuiala", category: "chirie", amount: "850,5", note: "  ", month: "2026-10" });
    expect(ok.success && ok.data).toMatchObject({ amount: 850.5, note: null });
  });
});

describe("promptul pentru sfaturi", () => {
  it("conține cifrele reale ale studentului", () => {
    const prompt = buildAdvicePrompt("2026-10", summarize(october), october, trend(october, "2026-10"));
    expect(prompt).toContain("Venituri totale: 2.000 lei");
    expect(prompt).toContain("Chirie / cămin: 800 lei (50% din cheltuieli)");
    expect(prompt).toContain("Rata de economisire: 20% din venit");
    expect(prompt).toContain("nevoi 65%");
  });

  it("împarte răspunsul pe secțiuni", () => {
    const sections = splitAdvice("## Pe scurt\n- ok\n\n## **Unde poți economisi**\n- mai puțin la ieșiri");
    expect(sections).toEqual([
      { title: "Pe scurt", body: "- ok" },
      { title: "Unde poți economisi", body: "- mai puțin la ieșiri" },
    ]);
  });
});
