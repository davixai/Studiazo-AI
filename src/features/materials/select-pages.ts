// Alegerea paginilor trimise asistentului (folosit de David în S6), în limita de caractere.
// Pur și determinist: fără bază de date, ușor de testat.

export type MaterialPage = { materialId: string; title: string; page: number; text: string };

const STOPWORDS = new Set([
  "care", "este", "sunt", "pentru", "despre", "dintre", "cum", "unde", "cand", "acest", "aceasta", "aceste",
  "acesta", "intre", "fara", "prin", "spre", "sau", "iar", "dar", "din", "the", "and", "una", "unei", "unui",
  "explica", "explicami", "spune", "spunemi", "imi", "mai", "foarte", "ceva",
]);

/** Fără diacritice, litere mici: „Ștergere” și „stergere” se potrivesc (inclusiv ş/ţ cu sedilă). */
export function normalizeForSearch(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function searchTerms(query: string) {
  const words = normalizeForSearch(query).split(/[^\p{L}\p{N}]+/u);
  return [...new Set(words.filter((w) => w.length >= 3 && !STOPWORDS.has(w)))];
}

function occurrences(haystack: string, needle: string) {
  let count = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) count++;
  return count;
}

/**
 * Fără `query`: paginile în ordinea citirii, până la `maxChars`.
 * Cu `query`: doar paginile care conțin termenii căutați, cele mai relevante primele; dacă nimic nu se potrivește,
 * lista e goală (asistentul poate spune „nu apare în materialele tale”).
 * Rezultatul e mereu în ordinea citirii (material, pagină). O pagină prea mare singură e scurtată la `maxChars`.
 */
export function selectPages(pages: MaterialPage[], { query, maxChars }: { query?: string; maxChars: number }) {
  if (maxChars <= 0 || pages.length === 0) return [];
  const indexed = pages.map((p, order) => ({ p, order }));
  let candidates = indexed;

  const terms = query ? searchTerms(query) : [];
  if (terms.length > 0) {
    candidates = indexed
      .map((c) => {
        const text = normalizeForSearch(c.p.text);
        return { ...c, score: terms.reduce((s, t) => s + occurrences(text, t), 0) };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score || a.order - b.order);
  }

  const chosen: Array<{ p: MaterialPage; order: number }> = [];
  let used = 0;
  for (const c of candidates) {
    const remaining = maxChars - used;
    if (remaining <= 0) break;
    if (c.p.text.length <= remaining) {
      chosen.push(c);
      used += c.p.text.length;
    } else if (chosen.length === 0) {
      chosen.push({ ...c, p: { ...c.p, text: c.p.text.slice(0, maxChars) } });
      used = maxChars;
    }
  }
  return chosen.sort((a, b) => a.order - b.order).map((c) => c.p);
}
