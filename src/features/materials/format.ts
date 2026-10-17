import { countLabel } from "@/features/subjects/format";

const decimal = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 });

/** „850 KB”, „3,2 MB”, „20 MB” — unități binare, la fel ca limita de 20 MB. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = Math.round(bytes / 1024);
  if (kb < 1024) return `${kb} KB`; // altfel 1.048.500 B ar apărea „1024 KB” în loc de „1 MB”
  return `${decimal.format(bytes / (1024 * 1024))} MB`;
}

export function formatPages(n: number) {
  return countLabel(n, "pagină", "pagini");
}
