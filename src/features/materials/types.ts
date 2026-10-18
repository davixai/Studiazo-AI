import type { MaterialStatus } from "@/lib/contracts/domain";
import { KIND_EXTENSION, kindFromMime, type MaterialKind } from "./schemas";

export type Material = {
  id: string;
  subjectId: string;
  title: string;
  kind: MaterialKind;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  status: MaterialStatus;
  statusMessage: string | null;
  studiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const MATERIAL_COLUMNS =
  "id, subject_id, title, mime_type, size_bytes, page_count, status, status_message, studied_at, created_at, updated_at";

export function toMaterial(r: Record<string, unknown>): Material {
  const mimeType = r.mime_type as string;
  return {
    id: r.id as string,
    subjectId: r.subject_id as string,
    title: r.title as string,
    kind: kindFromMime(mimeType),
    mimeType,
    sizeBytes: r.size_bytes as number,
    pageCount: (r.page_count as number | null) ?? null,
    status: r.status as MaterialStatus,
    statusMessage: (r.status_message as string | null) ?? null,
    studiedAt: (r.studied_at as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

/** Calea în bucketul privat: {user_id}/{subject_id}/{material_id}.{pdf|docx|pptx|txt|jpg}. Construită doar pe server. */
export function storagePathFor(userId: string, subjectId: string, materialId: string, kind: MaterialKind) {
  return `${userId}/${subjectId}/${materialId}.${KIND_EXTENSION[kind]}`;
}

/** Miniatura unei poze stă lângă original: …/{material_id}.thumb.jpg */
export function thumbPathFor(storagePath: string) {
  return storagePath.replace(/\.jpg$/, ".thumb.jpg");
}
