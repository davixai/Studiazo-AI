import { countLabel } from "@/features/subjects/format";

const decimal = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 });

/** „850 KB”, „3,2 MB”, „20 MB” — unități binare, la fel ca limita de 20 MB. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${decimal.format(bytes / (1024 * 1024))} MB`;
}

export function formatPages(n: number) {
  return countLabel(n, "pagină", "pagini");
}
