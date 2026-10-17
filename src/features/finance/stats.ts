import { bucketOf, categoryInfo, type FinanceKind } from "./categories";

// Statisticile bugetului, calculate din înregistrări. Funcții pure, testate în finance.test.ts.

export type FinanceEntry = {
  id: string;
  kind: FinanceKind;
  category: string;
  amount: number;
  note: string | null;
  /** „YYYY-MM” */
  month: string;
};

export type CategoryTotal = { category: string; label: string; emoji: string; amount: number; share: number };

export type MonthSummary = {
  income: number;
  expenses: number;
  balance: number;
  /** Partea din venit care rămâne (0–1); null fără venit. */
  savingsRate: number | null;
  incomeByCategory: CategoryTotal[];
  expensesByCategory: CategoryTotal[];
  /** Ponderi din venit pentru regula 50/30/20; null fără venit. */
  rule: { nevoi: number; dorinte: number; economii: number } | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function totals(entries: FinanceEntry[], kind: FinanceKind): CategoryTotal[] {
  const sums = new Map<string, number>();
  for (const e of entries) if (e.kind === kind) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
  const all = [...sums.values()].reduce((a, b) => a + b, 0);
  return [...sums.entries()]
    .map(([category, amount]) => {
      const info = categoryInfo(category);
      return { category, label: info.label, emoji: info.emoji, amount: round2(amount), share: all > 0 ? amount / all : 0 };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function summarize(entries: FinanceEntry[]): MonthSummary {
  const incomeByCategory = totals(entries, "venit");
  const expensesByCategory = totals(entries, "cheltuiala");
  const income = round2(incomeByCategory.reduce((s, c) => s + c.amount, 0));
  const expenses = round2(expensesByCategory.reduce((s, c) => s + c.amount, 0));
  const balance = round2(income - expenses);

  let rule: MonthSummary["rule"] = null;
  if (income > 0) {
    const nevoi = expensesByCategory.filter((c) => bucketOf(c.category) === "nevoi").reduce((s, c) => s + c.amount, 0);
    const dorinte = expenses - nevoi;
    rule = { nevoi: nevoi / income, dorinte: dorinte / income, economii: balance / income };
  }

  return { income, expenses, balance, savingsRate: income > 0 ? balance / income : null, incomeByCategory, expensesByCategory, rule };
}

/**
 * Câți lei în plus pe lună ar avea nevoie studentul: deficitul, sau cât lipsește până la 20% economii.
 * 0 când bugetul e deja sănătos sau nu există venituri.
 */
export function extraIncomeNeeded(summary: MonthSummary) {
  if (summary.balance < 0) return Math.round(-summary.balance);
  if (summary.income > 0 && summary.balance < summary.income * 0.2) return Math.round(summary.income * 0.2 - summary.balance);
  return 0;
}

export type TrendPoint ={ month: string; income: number; expenses: number };

/** Ultimele `count` luni până la `month` inclusiv, cu zero acolo unde nu există date. */
export function trend(entries: FinanceEntry[], month: string, count = 6): TrendPoint[] {
  const months = Array.from({ length: count }, (_, i) => shiftMonth(month, i - count + 1));
  return months.map((m) => {
    const s = summarize(entries.filter((e) => e.month === m));
    return { month: m, income: s.income, expenses: s.expenses };
  });
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string, style: "long" | "short" = "long") {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("ro-RO", {
    month: style === "long" ? "long" : "short",
    year: style === "long" ? "numeric" : undefined,
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

const LEI = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

export function formatLei(amount: number) {
  return `${LEI.format(amount)} lei`;
}

export function formatPercent(share: number) {
  return `${Math.round(share * 100)}%`;
}
