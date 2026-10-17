// Categoriile de buget. Lista oglindește constrângerea din supabase/migrations/20261017205000_finance.sql.

export type FinanceKind = "venit" | "cheltuiala";

/** „nevoi” și „dorinte” pentru regula 50/30/20 (nevoi ≤ 50%, dorințe ≤ 30%, economii ≥ 20% din venit). */
export type Bucket = "nevoi" | "dorinte";

type Category = { id: string; label: string; emoji: string };

export const INCOME_CATEGORIES = [
  { id: "bursa", label: "Bursă", emoji: "🎓" },
  { id: "job", label: "Job / salariu", emoji: "💼" },
  { id: "parinti", label: "Bani de la părinți", emoji: "🏠" },
  { id: "freelance", label: "Freelance / proiecte", emoji: "💻" },
  { id: "alte_venituri", label: "Alte venituri", emoji: "➕" },
] as const satisfies readonly Category[];

export const EXPENSE_CATEGORIES = [
  { id: "chirie", label: "Chirie / cămin", emoji: "🛏️", bucket: "nevoi" },
  { id: "mancare", label: "Mâncare", emoji: "🍲", bucket: "nevoi" },
  { id: "transport", label: "Transport", emoji: "🚌", bucket: "nevoi" },
  { id: "facturi", label: "Utilități și telefon", emoji: "💡", bucket: "nevoi" },
  { id: "facultate", label: "Facultate și cărți", emoji: "📚", bucket: "nevoi" },
  { id: "sanatate", label: "Sănătate", emoji: "💊", bucket: "nevoi" },
  { id: "iesiri", label: "Ieșiri și distracție", emoji: "🎉", bucket: "dorinte" },
  { id: "abonamente", label: "Abonamente", emoji: "📺", bucket: "dorinte" },
  { id: "cumparaturi", label: "Haine și cumpărături", emoji: "🛍️", bucket: "dorinte" },
  { id: "alte_cheltuieli", label: "Alte cheltuieli", emoji: "🧾", bucket: "dorinte" },
] as const satisfies readonly (Category & { bucket: Bucket })[];

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]["id"];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["id"];
export type FinanceCategory = IncomeCategory | ExpenseCategory;

const ALL: readonly (Category & { bucket?: Bucket })[] = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const INCOME_IDS = INCOME_CATEGORIES.map((c) => c.id) as [IncomeCategory, ...IncomeCategory[]];
export const EXPENSE_IDS = EXPENSE_CATEGORIES.map((c) => c.id) as [ExpenseCategory, ...ExpenseCategory[]];

export function categoryInfo(id: string) {
  return ALL.find((c) => c.id === id) ?? { id, label: id, emoji: "•" };
}

export function bucketOf(id: string): Bucket {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.bucket ?? "dorinte";
}
