/**
 * Numeral + substantiv, cu acordul din română: „1 material”, „3 materiale”, „20 de materiale”, „101 materiale”.
 * „de” apare când ultimele două cifre formează 0 (exceptând chiar 0) sau un număr ≥ 20.
 */
export function countLabel(n: number, one: string, many: string) {
  if (n === 1) return `1 ${one}`;
  const rest = n % 100;
  const withDe = n !== 0 && (rest === 0 || rest >= 20);
  return `${n} ${withDe ? "de " : ""}${many}`;
}

/** Rezumatul unei materii pe card: „3 materiale · 1 notiță” sau „Niciun material încă”. */
export function subjectContentSummary(materialCount: number, noteCount: number) {
  const parts = [
    materialCount > 0 ? countLabel(materialCount, "material", "materiale") : null,
    noteCount > 0 ? countLabel(noteCount, "notiță", "notițe") : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Niciun material încă";
}
