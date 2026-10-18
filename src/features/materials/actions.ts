"use server";

import { revalidatePath } from "next/cache";
import type { MaterialStatus } from "@/lib/contracts/domain";
import { requireUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { FormState } from "@/features/auth/schemas";
import { SubjectIdSchema } from "@/features/subjects/schemas";
import { extractDocument } from "./documents";
import {
  cleanTitle,
  FinishUploadSchema,
  hasSignatureFor,
  KIND_LABEL,
  KIND_MIME,
  kindFromMime,
  MaterialIdSchema,
  MAX_FILE_BYTES,
  StartUploadSchema,
  type DocumentKind,
  type MaterialKind,
} from "./schemas";
import { storagePathFor, thumbPathFor } from "./types";

// Fișierele merg direct din browser în Storage, prin URL-uri semnate create aici. Calea o construiește
// serverul din sesiune ({user_id}/{subject_id}/{material_id}.{ext}); browserul nu alege niciodată calea.
// user_id nu se trimite în rânduri: `default auth.uid()` + RLS.

const PREVIEW_MESSAGE = "Modul previzualizare nu salvează fișiere. Conectează Supabase ca să încarci materiale.";
const NOT_FOUND = "Materialul nu mai există. Reîncarcă pagina.";
const PAGE_INSERT_CHUNK = 50;

type Fail = { ok: false; message: string };
export type StartUploadResult = { ok: true; materialId: string; uploadUrl: string; thumbUploadUrl: string | null } | Fail;
export type FinishUploadResult = { ok: true; status: MaterialStatus; message: string | null } | Fail;

function revalidateSubject(subjectId: string) {
  revalidatePath(`/materii/${subjectId}`);
  revalidatePath("/materii"); // numărul de materiale de pe card
}

function pathsFor(storagePath: string, kind: MaterialKind) {
  return kind === "image" ? [storagePath, thumbPathFor(storagePath)] : [storagePath];
}

async function activeSubjectExists(supabase: SupabaseServerClient, subjectId: string) {
  const { data } = await supabase.from("subjects").select("id").eq("id", subjectId).is("archived_at", null).maybeSingle();
  return Boolean(data);
}

/** Pasul 1: verifică cererea și întoarce URL-urile semnate de încărcare (valabile 2 ore). */
export async function startUpload(input: unknown): Promise<StartUploadResult> {
  if (isPreviewMode()) return { ok: false, message: PREVIEW_MESSAGE };
  const user = await requireUser();

  const parsed = StartUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Fișier invalid." };
  const { subjectId, kind } = parsed.data;

  const supabase = await createClient();
  if (!(await activeSubjectExists(supabase, subjectId))) {
    return { ok: false, message: "Materia nu mai există. Reîncarcă pagina." };
  }

  const materialId = crypto.randomUUID();
  const path = storagePathFor(user.id, subjectId, materialId, kind);
  const bucket = supabase.storage.from("materials");

  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data) return { ok: false, message: "Nu am putut pregăti încărcarea. Încearcă din nou." };

  let thumbUploadUrl: string | null = null;
  if (kind === "image") {
    const thumb = await bucket.createSignedUploadUrl(thumbPathFor(path));
    thumbUploadUrl = thumb.data?.signedUrl ?? null; // fără miniatură afișăm originalul
  }

  return { ok: true, materialId, uploadUrl: data.signedUrl, thumbUploadUrl };
}

/**
 * Pasul 2 (după încărcare): verifică fișierul ajuns în Storage, creează rândul și, pentru documente, extrage textul.
 * Apelul repetat pentru același material nu creează duplicate.
 */
export async function finishUpload(input: unknown): Promise<FinishUploadResult> {
  if (isPreviewMode()) return { ok: false, message: PREVIEW_MESSAGE };
  const user = await requireUser();

  const parsed = FinishUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Încărcare invalidă. Încearcă din nou." };
  const { subjectId, materialId, kind } = parsed.data;

  const supabase = await createClient();
  const bucket = supabase.storage.from("materials");
  const path = storagePathFor(user.id, subjectId, materialId, kind);

  const existing = await supabase.from("materials").select("status, status_message").eq("id", materialId).maybeSingle();
  if (existing.data) {
    return { ok: true, status: existing.data.status as MaterialStatus, message: (existing.data.status_message as string | null) ?? null };
  }

  const { data: blob, error: downloadError } = await bucket.download(path);
  if (downloadError || !blob) return { ok: false, message: "Fișierul nu a ajuns pe server. Încearcă din nou." };
  const bytes = new Uint8Array(await blob.arrayBuffer());

  const reject = async (message: string): Promise<Fail> => {
    await bucket.remove(pathsFor(path, kind));
    return { ok: false, message };
  };
  if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) return reject("Fișierul trebuie să aibă între 1 octet și 20 MB.");
  if (!hasSignatureFor(kind, bytes)) {
    return reject(kind === "image" ? "Poza nu a putut fi salvată. Încearcă din nou." : `Fișierul nu este un document ${KIND_LABEL[kind]} valid.`);
  }

  const { error: insertError } = await supabase.from("materials").insert({
    id: materialId,
    subject_id: subjectId,
    title: cleanTitle(parsed.data.title, kind === "image" ? "Poză" : "Curs fără nume"),
    storage_path: path,
    mime_type: KIND_MIME[kind],
    size_bytes: bytes.length,
    status: kind === "image" ? "procesat" : "in_procesare",
  });
  if (insertError?.code === "23505") return { ok: true, status: "in_procesare", message: null }; // dublu-click: deja creat
  if (insertError) return reject("Nu am putut salva materialul. Verifică dacă materia mai există și încearcă din nou.");

  if (kind === "image") {
    revalidateSubject(subjectId);
    return { ok: true, status: "procesat", message: null };
  }

  const outcome = await processDocument(supabase, materialId, kind, bytes);
  revalidateSubject(subjectId);
  return { ok: true, ...outcome };
}

/** Extrage textul, îl salvează pe pagini și actualizează starea. Folosit și la „Încearcă din nou”. */
async function processDocument(supabase: SupabaseServerClient, materialId: string, kind: DocumentKind, bytes: Uint8Array) {
  const outcome = await extractDocument(kind, bytes);
  let status: MaterialStatus = outcome.status;
  let message = outcome.message;

  await supabase.from("material_pages").delete().eq("material_id", materialId);
  for (let i = 0; i < outcome.pages.length && status === "procesat"; i += PAGE_INSERT_CHUNK) {
    const rows = outcome.pages
      .slice(i, i + PAGE_INSERT_CHUNK)
      .map((p) => ({ material_id: materialId, page_number: p.page, content: p.text }));
    const { error } = await supabase.from("material_pages").insert(rows);
    if (error) {
      status = "esuat";
      message = "Nu am putut salva textul extras. Încearcă din nou.";
    }
  }
  if (status === "esuat") await supabase.from("material_pages").delete().eq("material_id", materialId);

  await supabase
    .from("materials")
    .update({ status, status_message: message, page_count: outcome.pageCount || null })
    .eq("id", materialId);
  return { status, message };
}

/** Șterge fișierele unei încărcări abandonate (încărcate, dar fără rând în baza de date). */
export async function discardUpload(input: unknown): Promise<void> {
  if (isPreviewMode()) return;
  const user = await requireUser();
  const parsed = FinishUploadSchema.omit({ title: true }).safeParse(input);
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data } = await supabase.from("materials").select("id").eq("id", parsed.data.materialId).maybeSingle();
  if (data) return; // materialul există: se șterge doar din listă, cu confirmare
  const path = storagePathFor(user.id, parsed.data.subjectId, parsed.data.materialId, parsed.data.kind);
  await supabase.storage.from("materials").remove(pathsFor(path, parsed.data.kind));
}

type MaterialRow = { id: string; subject_id: string; storage_path: string; mime_type: string; status: MaterialStatus };

async function readMaterial(supabase: SupabaseServerClient, formData: FormData): Promise<MaterialRow | null> {
  const id = MaterialIdSchema.safeParse(formData.get("id"));
  const subjectId = SubjectIdSchema.safeParse(formData.get("subjectId"));
  if (!id.success || !subjectId.success) return null;
  const { data } = await supabase
    .from("materials")
    .select("id, subject_id, storage_path, mime_type, status")
    .eq("id", id.data)
    .eq("subject_id", subjectId.data)
    .maybeSingle();
  return (data as MaterialRow | null) ?? null;
}

/** „Încearcă din nou” pentru un document eșuat sau rămas în procesare. */
export async function retryProcessing(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return { status: "error", message: PREVIEW_MESSAGE };
  await requireUser();

  const supabase = await createClient();
  const material = await readMaterial(supabase, formData);
  const kind = material ? kindFromMime(material.mime_type) : "image";
  if (!material || kind === "image") return { status: "error", message: NOT_FOUND };
  if (material.status !== "esuat" && material.status !== "in_procesare") return { status: "success" };

  await supabase.from("materials").update({ status: "in_procesare", status_message: null }).eq("id", material.id);
  const { data: blob } = await supabase.storage.from("materials").download(material.storage_path);
  if (!blob) {
    await supabase
      .from("materials")
      .update({ status: "esuat", status_message: "Fișierul lipsește. Șterge materialul și încarcă-l din nou." })
      .eq("id", material.id);
    revalidateSubject(material.subject_id);
    return { status: "error", message: "Fișierul lipsește. Șterge materialul și încarcă-l din nou." };
  }

  const outcome = await processDocument(supabase, material.id, kind, new Uint8Array(await blob.arrayBuffer()));
  revalidateSubject(material.subject_id);
  return outcome.status === "esuat"
    ? { status: "error", message: outcome.message ?? "Nu am putut procesa documentul." }
    : { status: "success" };
}

/** Marchează materialul ca parcurs (sau anulează marcajul). */
export async function setStudied(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return { status: "error", message: PREVIEW_MESSAGE };
  await requireUser();

  const supabase = await createClient();
  const material = await readMaterial(supabase, formData);
  if (!material) return { status: "error", message: NOT_FOUND };

  const studied = formData.get("studied") === "1";
  const { error } = await supabase
    .from("materials")
    .update({ studied_at: studied ? new Date().toISOString() : null })
    .eq("id", material.id);
  if (error) return { status: "error", message: "Nu am putut salva. Încearcă din nou." };

  revalidateSubject(material.subject_id);
  return { status: "success" };
}

/** Șterge fișierul (și miniatura), apoi rândul; paginile extrase dispar prin ON DELETE CASCADE. */
export async function deleteMaterial(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isPreviewMode()) return { status: "error", message: PREVIEW_MESSAGE };
  await requireUser();

  const supabase = await createClient();
  const material = await readMaterial(supabase, formData);
  if (!material) return { status: "error", message: NOT_FOUND };

  const kind: MaterialKind = kindFromMime(material.mime_type);
  const { error: storageError } = await supabase.storage.from("materials").remove(pathsFor(material.storage_path, kind));
  if (storageError) return { status: "error", message: "Nu am putut șterge fișierul. Încearcă din nou." };

  const { error } = await supabase.from("materials").delete().eq("id", material.id);
  if (error) return { status: "error", message: "Nu am putut șterge materialul. Încearcă din nou." };

  revalidateSubject(material.subject_id);
  return { status: "success", message: kind === "image" ? "Poza a fost ștearsă." : kind === "pdf" ? "PDF-ul a fost șters." : "Documentul a fost șters." };
}
