import { KIND_MIME, PDF_MIME, type MaterialKind } from "@/features/materials/schemas";
import { SUBJECT_COLORS, type SubjectColor, type TaskKind } from "@/lib/contracts/domain";
import { fromLocal } from "@/lib/time/zone";

// Logica pură a importului din Google Classroom: transformă răspunsurile API în materii, teme și notițe.
// Testată fără rețea (classroom.test.ts).

type GDate = { year?: number; month?: number; day?: number };
type GTime = { hours?: number; minutes?: number };

export type GMaterial = {
  driveFile?: { driveFile?: { id?: string; title?: string; alternateLink?: string } };
  link?: { url?: string; title?: string };
  youtubeVideo?: { title?: string; alternateLink?: string };
  form?: { title?: string; formUrl?: string };
};

export type GCourse = { id: string; name?: string; section?: string; alternateLink?: string; courseState?: string };

export type GCourseWork = {
  id: string;
  title?: string;
  description?: string;
  dueDate?: GDate;
  dueTime?: GTime;
  materials?: GMaterial[];
  alternateLink?: string;
};

/** Anunț (`text`) sau material de curs (`title` + `description`). */
export type GPost = { id: string; title?: string; text?: string; description?: string; materials?: GMaterial[]; creationTime?: string };

export type GSubmission = { courseWorkId?: string; state?: string };

export type ImportableFile = { id: string; title: string; from: "curs" | "tema" | "anunt" };

export const NOTE_TITLE = "Din Google Classroom";
/** Câte fișiere se preiau dintr-un curs, inclusiv cele din folderele atașate. */
export const MAX_FILES_PER_COURSE = 200;
const NOTE_MAX = 50_000;
const TASK_NOTES_MAX = 4_000;
const TITLE_MAX = 160;
const SUBJECT_NAME_MAX = 120;

/** Comparare de nume fără diferențe de majuscule, spații sau diacritice („Analiză” = „analiza”). */
export function sameName(a: string, b: string) {
  return normalize(a) === normalize(b);
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function clip(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export function subjectNameFor(course: GCourse) {
  return clip((course.name ?? "").replace(/\s+/g, " ").trim() || "Curs Classroom", SUBJECT_NAME_MAX);
}

export function colorFor(index: number): SubjectColor {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

/**
 * Termenul unei teme. Classroom dă data și ora în UTC; fără oră, termenul e la sfârșitul zilei (ora României).
 */
export function dueInstant(dueDate?: GDate, dueTime?: GTime): Date | null {
  if (!dueDate?.year || !dueDate.month || !dueDate.day) return null;
  if (dueTime) return new Date(Date.UTC(dueDate.year, dueDate.month - 1, dueDate.day, dueTime.hours ?? 0, dueTime.minutes ?? 0));
  const key = `${dueDate.year}-${String(dueDate.month).padStart(2, "0")}-${String(dueDate.day).padStart(2, "0")}`;
  return fromLocal(key, "23:59");
}

export function taskKindFor(title: string): TaskKind {
  const t = normalize(title);
  if (/\bexamen/.test(t)) return "examen";
  if (/\bcolocviu/.test(t)) return "colocviu";
  if (/\b(test|quiz|grila|evaluare|lucrare de control)/.test(t)) return "test";
  if (/\bproiect/.test(t)) return "proiect";
  return "tema";
}

/** Teme mai vechi de atât nu se mai importă (ar umple calendarul cu restanțe din semestre trecute). */
export const PAST_DUE_LIMIT_DAYS = 30;

export type TaskRow = { title: string; kind: TaskKind; due_at: string; notes: string | null; completed_at: string | null };

export function tasksFrom(work: GCourseWork[], submissions: GSubmission[], now: Date): TaskRow[] {
  const done = new Set(
    submissions.filter((s) => s.state === "TURNED_IN" || s.state === "RETURNED").map((s) => s.courseWorkId),
  );
  const oldest = now.getTime() - PAST_DUE_LIMIT_DAYS * 86_400_000;
  const rows: TaskRow[] = [];
  for (const w of work) {
    const due = dueInstant(w.dueDate, w.dueTime);
    if (!due || due.getTime() < oldest) continue;
    const title = clip((w.title ?? "").trim() || "Temă din Classroom", TITLE_MAX);
    const notes = [w.description?.trim(), w.alternateLink ? `Deschide în Classroom: ${w.alternateLink}` : null]
      .filter(Boolean)
      .join("\n\n");
    rows.push({
      title,
      kind: taskKindFor(title),
      due_at: due.toISOString(),
      notes: notes ? clip(notes, TASK_NOTES_MAX) : null,
      completed_at: done.has(w.id) ? now.toISOString() : null,
    });
  }
  return rows;
}

/** Fișierele Drive atașate, fără duplicate (același fișier poate apărea și în temă, și în anunț). */
export function filesFrom(sources: Array<{ from: ImportableFile["from"]; items: Array<{ materials?: GMaterial[] }> }>) {
  const seen = new Map<string, ImportableFile>();
  for (const { from, items } of sources) {
    for (const item of items) {
      for (const m of item.materials ?? []) {
        const f = m.driveFile?.driveFile;
        if (f?.id && !seen.has(f.id)) seen.set(f.id, { id: f.id, title: (f.title ?? "").trim() || "Fișier", from });
      }
    }
  }
  return [...seen.values()];
}

function linksOf(materials: GMaterial[] = []) {
  return materials
    .map((m) => {
      if (m.link?.url) return `- ${m.link.title ? `${m.link.title}: ` : ""}${m.link.url}`;
      if (m.youtubeVideo?.alternateLink) return `- Video: ${m.youtubeVideo.title ?? ""} ${m.youtubeVideo.alternateLink}`.replace(/\s+/g, " ");
      if (m.form?.formUrl) return `- Formular: ${m.form.title ?? ""} ${m.form.formUrl}`.replace(/\s+/g, " ");
      if (m.driveFile?.driveFile?.title) return `- Fișier: ${m.driveFile.driveFile.title}`;
      return null;
    })
    .filter((l): l is string => Boolean(l));
}

function dateLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : ` (${d.toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" })})`;
}

/**
 * Notița cu anunțurile și descrierile materialelor: textul din Classroom pe care asistentul îl poate cita.
 * Întoarce null dacă nu e nimic de salvat.
 */
export function courseNote(course: GCourse, announcements: GPost[], materials: GPost[]): string | null {
  const blocks: string[] = [];

  for (const m of materials) {
    const lines = [m.description?.trim(), ...linksOf(m.materials)].filter(Boolean);
    if (m.title || lines.length) blocks.push([`## Material: ${m.title ?? "fără titlu"}`, ...lines].join("\n"));
  }
  for (const a of announcements) {
    const lines = [a.text?.trim(), ...linksOf(a.materials)].filter(Boolean);
    if (lines.length) blocks.push([`## Anunț${dateLabel(a.creationTime)}`, ...lines].join("\n"));
  }
  if (blocks.length === 0) return null;

  const header = `Importat din Google Classroom: ${course.name ?? ""}${course.section ? ` (${course.section})` : ""}.`;
  return clip([header, ...blocks].join("\n\n"), NOTE_MAX);
}

export const FOLDER_MIME = "application/vnd.google-apps.folder";

/**
 * Cum se descarcă un fișier Drive ca material:
 * - `direct`: fișierul așa cum e (PDF, Word, PowerPoint, text, poze JPEG);
 * - `pdf`: documentele Google exportate ca PDF;
 * - `jpeg`: celelalte poze (PNG, WebP, HEIC…), luate de la Google deja convertite în JPEG.
 */
export type DownloadPlan = { kind: MaterialKind; via: "direct" | "pdf" | "jpeg" };

const GOOGLE_EXPORTABLE = new Set([
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.drawing",
]);

const TEXT_MIMES = new Set(["text/plain", "text/markdown", "text/csv"]);

export function downloadPlan(mimeType: string): DownloadPlan | null {
  if (mimeType === PDF_MIME) return { kind: "pdf", via: "direct" };
  if (GOOGLE_EXPORTABLE.has(mimeType)) return { kind: "pdf", via: "pdf" };
  if (mimeType === KIND_MIME.docx) return { kind: "docx", via: "direct" };
  if (mimeType === KIND_MIME.pptx) return { kind: "pptx", via: "direct" };
  if (TEXT_MIMES.has(mimeType)) return { kind: "txt", via: "direct" };
  if (mimeType === "image/jpeg") return { kind: "image", via: "direct" };
  if (mimeType.startsWith("image/")) return { kind: "image", via: "jpeg" };
  return null;
}

/** Mesajul pentru fișierele pe care nu le putem prelua. */
export function unsupportedMessage(name: string, mimeType: string) {
  if (/msword|ms-powerpoint|ms-excel|spreadsheetml/.test(mimeType)) {
    return `„${name}” e într-un format Office vechi sau Excel. Deschide-l în Google Drive, salvează-l ca PDF și reimportă.`;
  }
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return `„${name}” e video sau audio; îl găsești în continuare în Classroom.`;
  return `„${name}” are un format pe care nu-l putem citi încă.`;
}
