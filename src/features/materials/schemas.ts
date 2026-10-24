import { z } from "zod";
import { MATERIAL_KINDS, MAX_FILE_BYTES } from "./files";

export * from "./files";

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
