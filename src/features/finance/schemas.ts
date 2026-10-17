import { z } from "zod";
import { EXPENSE_IDS, INCOME_IDS } from "./categories";
import { isMonthKey } from "./stats";

export const MonthSchema = z.string().refine(isMonthKey, "Lună invalidă.");

/** „1.250,50”, „1250.5” sau „1 250” → 1250.5 */
export function parseAmount(raw: string) {
  const compact = raw.replace(/\s|lei/gi, "");
  const normalized = /,\d{1,2}$/.test(compact) ? compact.replace(/\./g, "").replace(",", ".") : compact.replace(/,/g, "");
  return Number(normalized);
}

const amountField = z
  .string()
  .trim()
  .min(1, "Scrie suma.")
  .transform(parseAmount)
  .pipe(z.number({ error: "Suma nu e un număr." }).positive("Suma trebuie să fie mai mare decât 0.").max(1_000_000, "Suma e prea mare."))
  .transform((n) => Math.round(n * 100) / 100);

const noteField = z
  .string()
  .trim()
  .max(120, "Maximum 120 de caractere.")
  .transform((s) => s || null);

export const EntryFormSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("venit"), category: z.enum(INCOME_IDS, "Alege o categorie."), amount: amountField, note: noteField, month: MonthSchema }),
  z.object({
    kind: z.literal("cheltuiala"),
    category: z.enum(EXPENSE_IDS, "Alege o categorie."),
    amount: amountField,
    note: noteField,
    month: MonthSchema,
  }),
]);
