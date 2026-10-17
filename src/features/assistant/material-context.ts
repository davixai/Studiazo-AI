// Alegerea paginilor relevante dintr-o materie, fără embeddings: potrivire pe cuvinte (fără diacritice),
// apoi cele mai relevante pagini până la limita de caractere. Fără întrebare → primele pagini, în ordine.

export type MaterialPage = { materialId: string; title: string; page: number; text: string };

const STOP_WORDS = new Set(["si", "sau", "de", "la", "in", "cu", "pe", "din", "ce", "care", "este", "sunt", "un", "o", "a", "al", "ale", "pentru", "despre", "mi", "imi", "explica"]);

export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function terms(query: string) {
  return [...new Set(normalize(query).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w)))];
}

export function pickPages(pages: MaterialPage[], query: string | null, maxChars: number): MaterialPage[] {
  const words = query ? terms(query) : [];
  const scored = pages.map((page, order) => {
    const haystack = normalize(page.text);
    const score = words.reduce((sum, w) => sum + (haystack.split(w).length - 1), 0);
    return { page, order, score };
  });
  const ranked = words.length > 0 && scored.some((s) => s.score > 0)
    ? scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score || a.order - b.order)
    : scored;

  const picked: typeof scored = [];
  let used = 0;
  for (const item of ranked) {
    const size = item.page.text.length;
    if (used + size > maxChars) {
      if (picked.length === 0) picked.push({ ...item, page: { ...item.page, text: item.page.text.slice(0, maxChars) } });
      break;
    }
    picked.push(item);
    used += size;
  }
  return picked.sort((a, b) => a.order - b.order).map((p) => p.page);
}
