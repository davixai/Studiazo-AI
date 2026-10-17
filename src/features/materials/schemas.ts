import { z } from "zod";

// Limitele oglindesc tabelul `materials` și bucketul `materials` (20 MB = 20.971.520 de octeți, MiB).
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MATERIAL_TITLE_MAX = 160;

export const PDF_MIME = "application/pdf";
/** Formatele de poză acceptate la alegere. Pozele se salvează mereu ca JPEG (micșorate în browser). */
export const IMAGE_INPUT_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const STORED_IMAGE_MIME = "image/jpeg";

export type MaterialKind = "pdf" | "image";

export const MaterialIdSchema = z.uuid();

export const StartUploadSchema = z.object({
  subjectId: z.uuid(),
  kind: z.enum(["pdf", "image"]),
  size: z.number().int().positive().max(MAX_FILE_BYTES, "Fișierul depășește 20 MB."),
});

export const FinishUploadSchema = z.object({
  subjectId: z.uuid(),
  materialId: z.uuid(),
  kind: z.enum(["pdf", "image"]),
  title: z.string(),
});

/** „Curs_03-grafuri.pdf” → „Curs 03 grafuri”; titlul gol devine „Curs fără nume”. */
export function titleFromFileName(name: string) {
  const base = name.replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return (base || "Curs fără nume").slice(0, MATERIAL_TITLE_MAX);
}

/** Titlul trimis de browser: curățat și limitat (nu ne bazăm pe validarea din client). */
export function cleanTitle(title: string, fallback: string) {
  const t = title.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return (t || fallback).slice(0, MATERIAL_TITLE_MAX);
}

/** Pozele se micșorează în browser, deci originalul poate fi mai mare decât limita de stocare. */
export const IMAGE_INPUT_MAX_BYTES = 50 * 1024 * 1024;

/** Prima verificare, în browser: tipul și mărimea. Întoarce mesajul de eroare sau null. */
export function checkFile(file: { name: string; type: string; size: number }, kind: MaterialKind): string | null {
  if (file.size === 0) return "Fișierul e gol.";
  if (kind === "pdf") {
    if (file.size > MAX_FILE_BYTES) return `„${file.name}” depășește 20 MB. Încearcă o variantă comprimată.`;
    const looksPdf = file.type === PDF_MIME || (file.type === "" && /\.pdf$/i.test(file.name));
    return looksPdf ? null : `„${file.name}” nu este PDF. Aici acceptăm doar fișiere PDF.`;
  }
  if (file.size > IMAGE_INPUT_MAX_BYTES) return `„${file.name}” depășește 50 MB.`;
  // Restul se verifică la decodare (și HEIC de pe iPhone merge, dacă browserul îl poate citi).
  return file.type === "" || file.type.startsWith("image/") ? null : `„${file.name}” nu este o poză.`;
}

/** Semnătura de la începutul fișierului: nu ne bazăm doar pe extensie sau pe tipul raportat de browser. */
export function hasPdfSignature(bytes: Uint8Array) {
  // "%PDF-"
  return bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

export function hasJpegSignature(bytes: Uint8Array) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}
