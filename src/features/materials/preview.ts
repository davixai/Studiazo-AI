import { PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import { SCANNED_PDF_MESSAGE } from "./extraction";
import type { Material } from "./types";

// Doar pentru modul previzualizare (STUDIA_PREVIEW=1): materiale demonstrative la prima materie,
// cu toate stările și cu poze de proporții diferite (portret, peisaj, panoramă) pentru verificarea încadrării.

const MB = 1024 * 1024;

function demo(n: number, partial: Partial<Material> & Pick<Material, "title" | "kind">, hoursAgo: number): Material {
  const at = new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
  return {
    id: `00000000-0000-4000-8000-0000000000c${n}`,
    subjectId: PREVIEW_SUBJECTS[0].id,
    mimeType: partial.kind === "pdf" ? "application/pdf" : "image/jpeg",
    sizeBytes: 2 * MB,
    pageCount: null,
    status: "procesat",
    statusMessage: null,
    studiedAt: null,
    createdAt: at,
    updatedAt: at,
    ...partial,
  };
}

export const PREVIEW_MATERIALS: Material[] = [
  demo(1, { title: "Curs 1 — Introducere în grafuri (demo)", kind: "pdf", pageCount: 24, sizeBytes: 3.2 * MB, studiedAt: new Date().toISOString() }, 50),
  demo(2, { title: "Curs 2 — Arbori binari de căutare și arbori echilibrați AVL (demo)", kind: "pdf", pageCount: 18, sizeBytes: 5.6 * MB, statusMessage: "1 pagină din 18 nu are text selectabil (probabil imagini scanate)." }, 26),
  demo(3, { title: "Seminar 3 scanat (demo)", kind: "pdf", pageCount: 6, sizeBytes: 8.1 * MB, status: "fara_text", statusMessage: SCANNED_PDF_MESSAGE }, 5),
  demo(4, { title: "Laborator protejat (demo)", kind: "pdf", sizeBytes: 0.4 * MB, status: "esuat", statusMessage: "PDF-ul este protejat cu parolă. Salvează-l fără parolă și încarcă-l din nou." }, 1),
  demo(5, { title: "Poză tablă (demo)", kind: "image", sizeBytes: 0.6 * MB }, 3),
  demo(6, { title: "Poză caiet (demo)", kind: "image", sizeBytes: 0.5 * MB }, 4),
  demo(7, { title: "Poză exercițiu (demo)", kind: "image", sizeBytes: 0.4 * MB }, 30),
];

/** Proporțiile pozelor demonstrative (lățime × înălțime), ca să verificăm încadrarea pe ecrane diferite. */
export const PREVIEW_IMAGE_SIZES: Record<string, [number, number]> = {
  "00000000-0000-4000-8000-0000000000c5": [1600, 1200],
  "00000000-0000-4000-8000-0000000000c6": [1200, 1600],
  "00000000-0000-4000-8000-0000000000c7": [2000, 900],
};

/** O „poză” SVG demonstrativă: gradient, grilă și dimensiunile scrise pe ea. */
export function previewImageSvg(id: string) {
  const [w, h] = PREVIEW_IMAGE_SIZES[id] ?? [1200, 900];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ede9fe"/><stop offset="1" stop-color="#c4b5fd"/></linearGradient>
<pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#7c3aed" stroke-opacity=".12" stroke-width="2"/></pattern></defs>
<rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>
<text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(w / 14)}" fill="#4c1d95" fill-opacity=".55">${w} × ${h} (demo)</text></svg>`;
}
