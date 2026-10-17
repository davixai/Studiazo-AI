import { formatLei, formatPercent, monthLabel, type FinanceEntry, type MonthSummary, type TrendPoint } from "./stats";

// Promptul pentru sfaturile financiare: datele REALE ale lunii, ca AI-ul să lucreze cu sumele studentului,
// nu cu sfaturi generale. Funcție pură, testată în finance.test.ts.

export const ADVICE_SECTIONS = ["Pe scurt", "Unde poți economisi", "Fondul de urgență", "Unde să investești", "Planul pentru luna viitoare"] as const;

export const ADVICE_INSTRUCTIONS = `Ești consilierul financiar al unui student din România (aplicația Studiazo AI).
Primești bugetul REAL al studentului pentru o lună. Toate sfaturile pornesc din cifrele lui: citează sumele, categoriile și procentele exacte din date și calculează cât poate economisi concret, în lei pe lună.

Reguli:
- Scrie în română, cu diacritice, prietenos și direct, la persoana a II-a singular. Maximum 380 de cuvinte.
- Folosește EXACT aceste titluri de secțiune, fiecare pe linie proprie, în această ordine: ${ADVICE_SECTIONS.map((s) => `"## ${s}"`).join(", ")}.
- Sub fiecare titlu: 2–4 puncte scurte cu „- ”. Pune sumele importante în **bold**.
- „Pe scurt”: diagnosticul lunii (cât intră, cât iese, rata de economisire, unde se duc cei mai mulți bani), comparat cu regula 50/30/20 dacă există venit.
- „Unde poți economisi”: ia cele mai mari 2–3 categorii de cheltuieli ale LUI și dă trucuri concrete pentru studenți (cantina studențească, gătit în grup, reduceri cu legitimația de student sau ISIC, abonamente partajate, cumpărături cu listă), fiecare cu economia estimată în lei/lună. Nu inventa prețuri exacte sau reduceri locale despre care nu ești sigur; spune „verifică” acolo.
- „Fondul de urgență”: ținta = 3 luni din cheltuielile lui medii (calculează suma) și cât să pună deoparte lunar ca s-o atingă în 6–12 luni.
- „Unde să investești”: DOAR dacă balanța e pozitivă. Pentru începători în România: întâi fondul de urgență; apoi titluri de stat (Tezaur, Fidelis) sau depozite pentru bani necesari în 1–3 ani; pe termen lung, sume mici lunare în ETF-uri pe indici largi, prin brokeri autorizați de ASF. Explică pe scurt riscul și orizontul. Fără acțiuni individuale, cripto speculativ, trading, credite pentru investiții sau „îmbogățire rapidă”. Nu da dobânzi sau randamente concrete (se schimbă). Dacă balanța e zero sau negativă, spune clar că acum prioritatea e echilibrarea bugetului și nu recomanda investiții.
- „Planul pentru luna viitoare”: 3 pași numerotați, fiecare cu o sumă țintă.
- Dacă lipsesc veniturile sau cheltuielile, spune ce lipsește și ce să completeze, fără să inventezi date.
- Ultima linie, separat: „_Sfaturile sunt orientative, nu consultanță financiară autorizată._”`;

export function buildAdvicePrompt(month: string, summary: MonthSummary, entries: FinanceEntry[], history: TrendPoint[]) {
  const lines: string[] = [`Luna analizată: ${monthLabel(month)}`, ""];

  lines.push(`Venituri totale: ${formatLei(summary.income)}`);
  for (const c of summary.incomeByCategory) lines.push(`- ${c.label}: ${formatLei(c.amount)}`);
  lines.push("", `Cheltuieli totale: ${formatLei(summary.expenses)}`);
  for (const c of summary.expensesByCategory) lines.push(`- ${c.label}: ${formatLei(c.amount)} (${formatPercent(c.share)} din cheltuieli)`);

  lines.push("", `Balanța lunii (venituri − cheltuieli): ${formatLei(summary.balance)}`);
  if (summary.savingsRate !== null) lines.push(`Rata de economisire: ${formatPercent(summary.savingsRate)} din venit`);
  if (summary.rule) {
    lines.push(
      `Regula 50/30/20 (din venit): nevoi ${formatPercent(summary.rule.nevoi)} (țintă ≤ 50%), dorințe ${formatPercent(summary.rule.dorinte)} (țintă ≤ 30%), economii ${formatPercent(summary.rule.economii)} (țintă ≥ 20%)`,
    );
  }

  const notes = entries.filter((e) => e.note).slice(0, 25);
  if (notes.length) {
    lines.push("", "Notițele studentului la înregistrări:");
    for (const e of notes) lines.push(`- ${e.kind === "venit" ? "venit" : "cheltuială"} ${formatLei(e.amount)}: ${e.note}`);
  }

  const withData = history.filter((h) => h.income > 0 || h.expenses > 0);
  if (withData.length > 1) {
    lines.push("", "Istoric (ultimele luni cu date):");
    for (const h of withData) lines.push(`- ${monthLabel(h.month)}: venituri ${formatLei(h.income)}, cheltuieli ${formatLei(h.expenses)}`);
    const avg = withData.reduce((s, h) => s + h.expenses, 0) / withData.length;
    lines.push(`Cheltuieli medii lunare: ${formatLei(Math.round(avg))}`);
  }

  return lines.join("\n");
}

/** Împarte răspunsul pe secțiunile „## Titlu”; textul dinaintea primului titlu (dacă există) intră în prima secțiune. */
export function splitAdvice(text: string): Array<{ title: string; body: string }> {
  const parts = text.replace(/\r\n/g, "\n").split(/^#{1,3}\s+/m);
  const sections: Array<{ title: string; body: string }> = [];
  for (const [i, part] of parts.entries()) {
    if (i === 0) {
      if (part.trim()) sections.push({ title: "", body: part.trim() });
      continue;
    }
    const [title, ...rest] = part.split("\n");
    sections.push({ title: title.replace(/\*\*/g, "").trim(), body: rest.join("\n").trim() });
  }
  return sections;
}
