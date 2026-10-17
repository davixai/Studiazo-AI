import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/time/zone";
import { shiftMonth, type FinanceEntry } from "./stats";

export const HISTORY_MONTHS = 6;

export type FinanceData =
  | { available: true; entries: FinanceEntry[]; history: FinanceEntry[] }
  | { available: false; reason: "migration" | "error" };

/** Luna curentă, ora României („YYYY-MM”). */
export function currentMonth(now = new Date()) {
  return toDateKey(now).slice(0, 7);
}

export function toEntry(r: Record<string, unknown>): FinanceEntry {
  return {
    id: r.id as string,
    kind: r.kind as FinanceEntry["kind"],
    category: r.category as string,
    amount: Number(r.amount),
    note: (r.note as string | null) ?? null,
    month: String(r.month).slice(0, 7),
  };
}

/** Înregistrările lunii și istoricul ultimelor 6 luni (pentru grafic și pentru sfaturile AI). */
export async function getFinance(month: string): Promise<FinanceData> {
  if (isPreviewMode()) return previewData(month);
  if (!(await getCurrentUser())) return { available: false, reason: "error" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_entries")
    .select("id, kind, category, amount, note, month")
    .gte("month", `${shiftMonth(month, -(HISTORY_MONTHS - 1))}-01`)
    .lte("month", `${month}-01`)
    .order("created_at", { ascending: true });

  // Tabelul lipsește: migrația 20261017205000_finance.sql nu a fost aplicată încă.
  if (error?.code === "42P01" || error?.code === "PGRST205") return { available: false, reason: "migration" };
  if (error) return { available: false, reason: "error" };

  const history = (data ?? []).map(toEntry);
  return { available: true, entries: history.filter((e) => e.month === month), history };
}

/** Date demonstrative pentru modul previzualizare (STUDIA_PREVIEW=1). */
function previewData(month: string): FinanceData {
  const rows: Array<[FinanceEntry["kind"], string, number, string | null]> = [
    ["venit", "bursa", 900, "Bursă de merit"],
    ["venit", "parinti", 1200, null],
    ["venit", "job", 800, "Part-time weekend"],
    ["cheltuiala", "chirie", 1100, "Chirie apartament, împărțit cu un coleg"],
    ["cheltuiala", "mancare", 950, null],
    ["cheltuiala", "transport", 80, null],
    ["cheltuiala", "facturi", 160, null],
    ["cheltuiala", "facultate", 120, "Cărți"],
    ["cheltuiala", "iesiri", 420, null],
    ["cheltuiala", "abonamente", 95, "Netflix, Spotify, sală"],
    ["cheltuiala", "cumparaturi", 260, null],
  ];
  const history: FinanceEntry[] = [];
  for (let i = HISTORY_MONTHS - 1; i >= 0; i--) {
    const m = shiftMonth(month, -i);
    const factor = 1 + ((i * 7) % 5) / 20 - 0.1;
    rows.forEach(([kind, category, amount, note], j) => {
      history.push({ id: `demo-${i}-${j}`, kind, category, amount: Math.round(kind === "venit" ? amount : amount * factor), note, month: m });
    });
  }
  return { available: true, entries: history.filter((e) => e.month === month), history };
}
