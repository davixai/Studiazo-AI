import "server-only";
import { AI_LIMITS } from "@/lib/contracts/ai-tools";
import { isPreviewMode } from "@/lib/env";
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import { SubjectIdSchema } from "@/features/subjects/schemas";
import { PREVIEW_MATERIALS } from "./preview";
import { MaterialIdSchema } from "./schemas";
import { selectPages, type MaterialPage } from "./select-pages";
import { MATERIAL_COLUMNS, toMaterial, type Material } from "./types";

// Proprietar: Sergiu. Exportă pentru David (asistentul AI): listMaterials, getMaterialPages, getMaterialImageUrl.
// Nicio funcție nu primește user_id: RLS limitează rezultatele la utilizatorul curent.

/** Materialele unei materii (documente și poze), cele mai noi primele. */
export async function listMaterials(subjectId: string): Promise<Material[]> {
  if (!SubjectIdSchema.safeParse(subjectId).success) return [];
  if (isPreviewMode()) return PREVIEW_MATERIALS.filter((m) => m.subjectId === subjectId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select(MATERIAL_COLUMNS)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Nu am putut citi materialele: ${error.message}`);
  return (data ?? []).map(toMaterial);
}

/**
 * Textul paginilor documentelor procesate ale unei materii, pentru asistent (citări „pagina N”).
 * Cu `query`: doar paginile relevante (fără diacritice), cele mai potrivite întâi; listă goală dacă nimic nu se potrivește.
 * Rezultatul are în total cel mult `maxChars` caractere (implicit AI_LIMITS.maxMaterialChars) și e în ordinea citirii.
 */
export async function getMaterialPages(
  subjectId: string,
  { query, maxChars = AI_LIMITS.maxMaterialChars }: { query?: string; maxChars?: number } = {},
): Promise<MaterialPage[]> {
  if (!SubjectIdSchema.safeParse(subjectId).success || isPreviewMode()) return [];

  const supabase = await createClient();
  const { data: materials, error } = await supabase
    .from("materials")
    .select("id, title")
    .eq("subject_id", subjectId)
    .not("mime_type", "like", "image/%")
    .eq("status", "procesat")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Nu am putut citi materialele: ${error.message}`);
  if (!materials?.length) return [];

  const titles = new Map(materials.map((m) => [m.id as string, m.title as string]));
  const order = new Map(materials.map((m, i) => [m.id as string, i]));
  const rows = await fetchAllPages(supabase, [...titles.keys()]);

  const pages = rows
    .map((r) => ({ materialId: r.material_id, title: titles.get(r.material_id) ?? "", page: r.page_number, text: r.content }))
    .sort((a, b) => (order.get(a.materialId) ?? 0) - (order.get(b.materialId) ?? 0) || a.page - b.page);
  return selectPages(pages, { query, maxChars });
}

type PageRow = { material_id: string; page_number: number; content: string };

/** PostgREST întoarce cel mult 1.000 de rânduri pe cerere: citim pe bucăți. */
async function fetchAllPages(supabase: SupabaseServerClient, materialIds: string[]) {
  const chunk = 1000;
  const all: PageRow[] = [];
  for (let from = 0; ; from += chunk) {
    const { data, error } = await supabase
      .from("material_pages")
      .select("material_id, page_number, content")
      .in("material_id", materialIds)
      .order("material_id")
      .order("page_number")
      .range(from, from + chunk - 1);
    if (error) throw new Error(`Nu am putut citi paginile: ${error.message}`);
    all.push(...((data ?? []) as PageRow[]));
    if (!data || data.length < chunk) return all;
  }
}

/** Durata URL-urilor semnate pentru poze (pentru asistent și afișare). */
export const IMAGE_URL_SECONDS = 120;

/** URL semnat, de scurtă durată, pentru o poză (asistentul o trimite modelului). null dacă nu există sau nu e poză. */
export async function getMaterialImageUrl(materialId: string): Promise<string | null> {
  if (!MaterialIdSchema.safeParse(materialId).success || isPreviewMode()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("storage_path, mime_type")
    .eq("id", materialId)
    .like("mime_type", "image/%")
    .maybeSingle();
  if (!data) return null;

  const { data: signed } = await supabase.storage.from("materials").createSignedUrl(data.storage_path as string, IMAGE_URL_SECONDS);
  return signed?.signedUrl ?? null;
}
