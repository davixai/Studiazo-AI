"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { extractPdf } from "@/features/materials/pdf";
import {
  hasJpegSignature,
  hasPdfSignature,
  MAX_FILE_BYTES,
  PDF_MIME,
  STORED_IMAGE_MIME,
  titleFromFileName,
} from "@/features/materials/schemas";
import { storagePathFor } from "@/features/materials/types";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import { classroom, drive, forgetToken, GoogleError, readToken } from "./google";
import {
  colorFor,
  courseNote,
  downloadPlan,
  filesFrom,
  NOTE_TITLE,
  sameName,
  subjectNameFor,
  tasksFrom,
  unsupportedMessage,
  type ImportableFile,
} from "./mapping";

// Importul din Google Classroom, pas cu pas (ca interfața să arate progresul și nicio cerere să nu dureze prea mult):
// 1. loadCourses   – lista cursurilor active;
// 2. importCourse  – materia, temele cu termen și notița cu anunțuri; întoarce fișierele Drive de preluat;
// 3. importFile    – un fișier: descărcat de pe Drive, salvat în Storage, textul extras pe pagini (ca la încărcarea manuală).
// Duplicatele se evită după nume, deci importul se poate repeta oricând. user_id vine din `default auth.uid()` + RLS.

type Fail = { ok: false; reason: "auth" | "error"; message: string };

const NEEDS_AUTH: Fail = { ok: false, reason: "auth", message: "Conexiunea cu Google a expirat. Conectează-te din nou." };
const PREVIEW: Fail = { ok: false, reason: "error", message: "Modul previzualizare nu poate importa din Classroom." };
const MAX_FILES_PER_COURSE = 80;
const PAGE_INSERT_CHUNK = 50;

const CourseInputSchema = z.object({ courseId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/), colorIndex: z.number().int().min(0).max(1000) });
const FileInputSchema = z.object({
  subjectId: z.uuid(),
  fileId: z.string().regex(/^[A-Za-z0-9_-]{10,200}$/),
  title: z.string().max(300),
});

function googleFail(error: unknown, fallback: string): Fail {
  if (!(error instanceof GoogleError)) return { ok: false, reason: "error", message: fallback };
  if (error.status === 401) return NEEDS_AUTH;
  if (error.reason === "accessNotConfigured" || error.reason === "SERVICE_DISABLED") {
    return { ok: false, reason: "error", message: "Classroom API sau Drive API nu este activat în proiectul Google Cloud (vezi docs/SETUP.md)." };
  }
  if (error.status === 403) {
    return {
      ok: false,
      reason: "auth",
      message:
        "Google nu ne-a dat acces la aceste date. Reconectează-te și bifează toate permisiunile. La conturile facultății, administratorul poate bloca aplicațiile externe.",
    };
  }
  return { ok: false, reason: "error", message: fallback };
}

/** Listele secundare (anunțuri, predări…) pot lipsi fără să oprească importul; doar tokenul expirat oprește tot. */
async function optional<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof GoogleError && error.status === 401) throw error;
    return [];
  }
}

async function session() {
  const user = await requireUser();
  return { user, token: await readToken(user.id) };
}

export type ClassroomCourse = { id: string; name: string; section: string | null; link: string | null; imported: boolean };

export async function loadCourses(): Promise<{ ok: true; courses: ClassroomCourse[] } | Fail> {
  if (isPreviewMode()) return PREVIEW;
  const { token } = await session();
  if (!token) return NEEDS_AUTH;

  try {
    const supabase = await createClient();
    const [courses, { data: subjects }] = await Promise.all([classroom.courses(token), supabase.from("subjects").select("name")]);
    const names = (subjects ?? []).map((s) => s.name as string);
    return {
      ok: true,
      courses: courses.map((c) => {
        const name = subjectNameFor(c);
        return { id: c.id, name, section: c.section ?? null, link: c.alternateLink ?? null, imported: names.some((n) => sameName(n, name)) };
      }),
    };
  } catch (error) {
    return googleFail(error, "Nu am putut citi cursurile din Classroom. Încearcă din nou.");
  }
}

export type CourseImport = {
  ok: true;
  subjectId: string;
  subjectName: string;
  tasksAdded: number;
  noteSaved: boolean;
  files: ImportableFile[];
};

async function findOrCreateSubject(supabase: SupabaseServerClient, name: string, colorIndex: number) {
  const find = async () => {
    const { data } = await supabase.from("subjects").select("id, name, archived_at");
    return (data ?? []).find((s) => sameName(s.name as string, name));
  };

  let subject = await find();
  if (!subject) {
    const { error } = await supabase.from("subjects").insert({ name, color: colorFor(colorIndex) });
    if (error && error.code !== "23505") return null;
    subject = await find();
  }
  if (!subject) return null;
  if (subject.archived_at) await supabase.from("subjects").update({ archived_at: null }).eq("id", subject.id);
  return subject.id as string;
}

export async function importCourse(input: unknown): Promise<CourseImport | Fail> {
  if (isPreviewMode()) return PREVIEW;
  const parsed = CourseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "error", message: "Curs invalid." };
  const { token } = await session();
  if (!token) return NEEDS_AUTH;
  const { courseId, colorIndex } = parsed.data;

  try {
    const course = await classroom.course(token, courseId);
    const [work, posts, announcements, submissions] = await Promise.all([
      optional(classroom.courseWork(token, courseId)),
      optional(classroom.courseWorkMaterials(token, courseId)),
      optional(classroom.announcements(token, courseId)),
      optional(classroom.mySubmissions(token, courseId)),
    ]);

    const supabase = await createClient();
    const subjectName = subjectNameFor(course);
    const subjectId = await findOrCreateSubject(supabase, subjectName, colorIndex);
    if (!subjectId) return { ok: false, reason: "error", message: `Nu am putut crea materia „${subjectName}”.` };

    // Teme: doar cele noi (după titlu), cu termen.
    const { data: existingTasks } = await supabase.from("tasks").select("title").eq("subject_id", subjectId);
    const fresh = tasksFrom(work, submissions, new Date()).filter(
      (t) => !(existingTasks ?? []).some((e) => sameName(e.title as string, t.title)),
    );
    let tasksAdded = 0;
    if (fresh.length > 0) {
      const { error } = await supabase.from("tasks").insert(fresh.map((t) => ({ ...t, subject_id: subjectId })));
      if (!error) tasksAdded = fresh.length;
    }

    // Notița cu anunțurile și descrierile: o singură notiță pe materie, rescrisă la fiecare import.
    let noteSaved = false;
    const content = courseNote(course, announcements, posts);
    if (content) {
      const { data: note } = await supabase.from("notes").select("id").eq("subject_id", subjectId).eq("title", NOTE_TITLE).maybeSingle();
      const { error } = note
        ? await supabase.from("notes").update({ content }).eq("id", note.id)
        : await supabase.from("notes").insert({ subject_id: subjectId, title: NOTE_TITLE, topic: "Classroom", content });
      noteSaved = !error;
    }

    // Fișierele Drive care nu există deja ca materiale.
    const { data: materials } = await supabase.from("materials").select("title").eq("subject_id", subjectId);
    const files = filesFrom([
      { from: "curs", items: posts },
      { from: "tema", items: work },
      { from: "anunt", items: announcements },
    ])
      .filter((f) => !(materials ?? []).some((m) => sameName(m.title as string, titleFromFileName(f.title))))
      .slice(0, MAX_FILES_PER_COURSE);

    revalidatePath("/", "layout");
    return { ok: true, subjectId, subjectName, tasksAdded, noteSaved, files };
  } catch (error) {
    return googleFail(error, "Nu am putut importa cursul. Încearcă din nou.");
  }
}

export type FileImport = { ok: true; status: "importat" | "existent" | "sarit"; message: string | null } | Fail;

export async function importFile(input: unknown): Promise<FileImport> {
  if (isPreviewMode()) return PREVIEW;
  const parsed = FileInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "error", message: "Fișier invalid." };
  const { user, token } = await session();
  if (!token) return NEEDS_AUTH;
  const { subjectId, fileId } = parsed.data;
  const skip = (message: string): FileImport => ({ ok: true, status: "sarit", message });

  const supabase = await createClient();
  const { data: subject } = await supabase.from("subjects").select("id").eq("id", subjectId).maybeSingle();
  if (!subject) return { ok: false, reason: "error", message: "Materia nu mai există." };

  let bytes: Uint8Array;
  let title: string;
  let kind: "pdf" | "image";
  try {
    const meta = await drive.meta(token, fileId);
    const plan = downloadPlan(meta.mimeType);
    if (!plan) return skip(unsupportedMessage(meta.name, meta.mimeType));
    if (!plan.export && Number(meta.size ?? 0) > MAX_FILE_BYTES) return skip(`„${meta.name}” depășește 20 MB.`);

    title = titleFromFileName(meta.name);
    kind = plan.kind;
    const { data: same } = await supabase.from("materials").select("title").eq("subject_id", subjectId);
    if ((same ?? []).some((m) => sameName(m.title as string, title))) return { ok: true, status: "existent", message: null };

    bytes = await drive.bytes(token, fileId, plan.export);
  } catch (error) {
    if (error instanceof GoogleError && error.status === 401) return NEEDS_AUTH;
    const name = parsed.data.title || "Fișierul";
    if (error instanceof GoogleError && error.reason === "exportSizeLimitExceeded") {
      return skip(`„${name}” e prea mare ca Google să-l exporte ca PDF.`);
    }
    if (error instanceof GoogleError && (error.status === 403 || error.status === 404)) {
      return skip(`Nu avem acces la „${name}” (poate e privat sau a fost șters).`);
    }
    return skip(`Nu am putut descărca „${name}”.`);
  }

  if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) return skip(`„${title}” trebuie să aibă între 1 octet și 20 MB.`);
  if (kind === "pdf" && !hasPdfSignature(bytes)) return skip(`„${title}” nu este un PDF valid.`);
  if (kind === "image" && !hasJpegSignature(bytes)) return skip(`„${title}” nu este o poză JPEG validă.`);

  const materialId = crypto.randomUUID();
  const path = storagePathFor(user.id, subjectId, materialId, kind);
  const bucket = supabase.storage.from("materials");
  const { error: uploadError } = await bucket.upload(path, bytes, {
    contentType: kind === "pdf" ? PDF_MIME : STORED_IMAGE_MIME,
    upsert: false,
  });
  if (uploadError) return skip(`Nu am putut salva „${title}”.`);

  const { error: insertError } = await supabase.from("materials").insert({
    id: materialId,
    subject_id: subjectId,
    title,
    storage_path: path,
    mime_type: kind === "pdf" ? PDF_MIME : STORED_IMAGE_MIME,
    size_bytes: bytes.length,
    status: kind === "pdf" ? "in_procesare" : "procesat",
  });
  if (insertError) {
    await bucket.remove([path]);
    return skip(`Nu am putut salva „${title}”.`);
  }

  let message: string | null = null;
  if (kind === "pdf") message = await savePdfText(supabase, materialId, bytes);

  revalidatePath(`/materii/${subjectId}`);
  return { ok: true, status: "importat", message };
}

/** Textul pe pagini, ca asistentul să-l poată cita (aceeași logică ca la încărcarea manuală din Materii). */
async function savePdfText(supabase: SupabaseServerClient, materialId: string, bytes: Uint8Array) {
  const outcome = await extractPdf(bytes);
  let status = outcome.status;
  let message = outcome.message;

  for (let i = 0; i < outcome.pages.length && status === "procesat"; i += PAGE_INSERT_CHUNK) {
    const rows = outcome.pages
      .slice(i, i + PAGE_INSERT_CHUNK)
      .map((p) => ({ material_id: materialId, page_number: p.page, content: p.text }));
    const { error } = await supabase.from("material_pages").insert(rows);
    if (error) {
      status = "esuat";
      message = "Nu am putut salva textul extras. Încearcă din nou din pagina materiei.";
    }
  }
  if (status === "esuat") await supabase.from("material_pages").delete().eq("material_id", materialId);

  await supabase.from("materials").update({ status, status_message: message, page_count: outcome.pageCount || null }).eq("id", materialId);
  return message;
}

export async function disconnectClassroom() {
  await requireUser();
  await forgetToken();
  revalidatePath("/classroom");
}
