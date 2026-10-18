import { z } from "zod";
import { safeText } from "./extraction";

// Limitele oglindesc tabelul `materials` și bucketul `materials` (20 MB = 20.971.520 de octeți, MiB).
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MATERIAL_TITLE_MAX = 160;

export const PDF_MIME = "application/pdf";
/** Formatele de poză acceptate la alegere. Pozele se salvează mereu ca JPEG (micșorate în browser). */
export const IMAGE_INPUT_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const STORED_IMAGE_MIME = "image/jpeg";

export const MATERIAL_KINDS = ["pdf", "docx", "pptx", "txt", "image"] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];
/** Documentele: li se extrage textul pe pagini (slide-uri la PowerPoint, secțiuni la Word și text). */
export type DocumentKind = Exclude<MaterialKind, "image">;

/** Tipul salvat în `materials.mime_type` și extensia din Storage, pentru fiecare fel de material. */
export const KIND_MIME: Record<MaterialKind, string> = {
  pdf: PDF_MIME,
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  image: STORED_IMAGE_MIME,
};
export const KIND_EXTENSION: Record<MaterialKind, string> = { pdf: "pdf", docx: "docx", pptx: "pptx", txt: "txt", image: "jpg" };
export const KIND_LABEL: Record<DocumentKind, string> = { pdf: "PDF", docx: "Word", pptx: "PowerPoint", txt: "text" };

export function kindFromMime(mime: string): MaterialKind {
  if (mime.startsWith("image/")) return "image";
  return (Object.keys(KIND_MIME) as MaterialKind[]).find((k) => KIND_MIME[k] === mime) ?? "pdf";
}

/** Atributul `accept` pentru alegerea documentelor. */
export const DOCUMENT_ACCEPT = `${PDF_MIME},.pdf,${KIND_MIME.docx},.docx,${KIND_MIME.pptx},.pptx,text/plain,text/markdown,.txt,.md`;

/** Felul documentului după tip sau extensie; null dacă nu e un document acceptat. */
export function documentKindOf(file: { name: string; type: string }): DocumentKind | null {
  if (file.type === PDF_MIME || /\.pdf$/i.test(file.name)) return "pdf";
  if (file.type === KIND_MIME.docx || /\.docx$/i.test(file.name)) return "docx";
  if (file.type === KIND_MIME.pptx || /\.pptx$/i.test(file.name)) return "pptx";
  if (file.type === "text/plain" || file.type === "text/markdown" || /\.(txt|md)$/i.test(file.name)) return "txt";
  return null;
}

export const MaterialIdSchema = z.uuid();

export const StartUploadSchema = z.object({
  subjectId: z.uuid(),
  kind: z.enum(MATERIAL_KINDS),
  size: z.number().int().positive().max(MAX_FILE_BYTES, "Fișierul depășește 20 MB."),
});

export const FinishUploadSchema = z.object({
  subjectId: z.uuid(),
  materialId: z.uuid(),
  kind: z.enum(MATERIAL_KINDS),
  title: z.string(),
});

/** „Curs_03-grafuri.pdf” → „Curs 03 grafuri”; titlul gol devine „Curs fără nume”. */
export function titleFromFileName(name: string) {
  const base = name.replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return safeText(base || "Curs fără nume", MATERIAL_TITLE_MAX).trim();
}

/** Titlul trimis de browser: curățat și limitat (nu ne bazăm pe validarea din client). */
export function cleanTitle(title: string, fallback: string) {
  const t = safeText(title.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim(), MATERIAL_TITLE_MAX).trim();
  return t || fallback;
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
  if (kind !== "image") {
    if (file.size > MAX_FILE_BYTES) return `„${file.name}” depășește 20 MB.`;
    return documentKindOf(file) === kind ? null : `„${file.name}” nu este un fișier ${KIND_LABEL[kind]}.`;
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

/** Word (.docx) și PowerPoint (.pptx) sunt arhive ZIP: „PK\x03\x04”. */
export function hasZipSignature(bytes: Uint8Array) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

/** Text: fără octeți nuli și UTF-8 valid (un fișier binar redenumit .txt nu trece). */
export function looksLikeText(bytes: Uint8Array) {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/** Verificarea semnăturii pentru fiecare fel de material. */
export function hasSignatureFor(kind: MaterialKind, bytes: Uint8Array) {
  if (kind === "pdf") return hasPdfSignature(bytes);
  if (kind === "docx" || kind === "pptx") return hasZipSignature(bytes);
  if (kind === "txt") return looksLikeText(bytes);
  return hasJpegSignature(bytes);
}
