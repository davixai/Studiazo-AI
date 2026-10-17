import type { MaterialStatus } from "@/lib/contracts/domain";
import { countLabel } from "@/features/subjects/format";

// Logica pură a extragerii: curățarea textului și decizia de stare. Testată fără PDF-uri reale.

/** Limita coloanei `material_pages.content`. */
export const PAGE_TEXT_MAX = 40_000;
/** Sub atâtea caractere vizibile în tot documentul considerăm că PDF-ul e scanat. */
const MIN_DOCUMENT_CHARS = 50;
/** O pagină cu mai puțin de atâtea caractere vizibile e tratată ca „fără text” (ex. o imagine scanată). */
const MIN_PAGE_CHARS = 10;

export const SCANNED_PDF_MESSAGE =
  "Acest PDF nu are text selectabil. Asistentul nu îl poate citi încă; încearcă un PDF exportat din Word sau fotografiază pagina importantă.";

/** Scoate caracterele de control (Postgres nu acceptă \u0000), comprimă spațiile, păstrează paragrafele. */
export function normalizePageText(text: string) {
  return text
    .replace(/[\u0000-\u0008\u000b\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ *\r?\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, PAGE_TEXT_MAX);
}

function visibleChars(text: string) {
  return text.replace(/\s/g, "").length;
}

export type ExtractionOutcome = {
  status: Extract<MaterialStatus, "procesat" | "fara_text" | "esuat">;
  message: string | null;
  pageCount: number;
  /** Doar paginile cu text, numerotate de la 1 (pentru citări „pagina N”). */
  pages: Array<{ page: number; text: string }>;
};

export function classifyExtraction(rawPages: string[]): ExtractionOutcome {
  const pageCount = rawPages.length;
  if (pageCount === 0) return { status: "esuat", message: "PDF-ul nu conține nicio pagină.", pageCount, pages: [] };

  const texts = rawPages.map(normalizePageText);
  const total = texts.reduce((sum, t) => sum + visibleChars(t), 0);
  if (total < MIN_DOCUMENT_CHARS) return { status: "fara_text", message: SCANNED_PDF_MESSAGE, pageCount, pages: [] };

  const pages = texts
    .map((text, i) => ({ page: i + 1, text }))
    .filter((p) => visibleChars(p.text) >= MIN_PAGE_CHARS);
  const empty = pageCount - pages.length;
  const message =
    empty > 0
      ? `${countLabel(empty, "pagină", "pagini")} din ${pageCount} ${empty === 1 ? "nu are" : "nu au"} text selectabil (probabil imagini scanate).`
      : null;
  return { status: "procesat", message, pageCount, pages };
}
