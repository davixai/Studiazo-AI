import "server-only";
import { createClient } from "@/lib/supabase/server";
import { NOTES_SOURCE, type MaterialPage } from "./material-context";

// Adaptor local peste tabelele lui Sergiu (notes, materials, material_pages), doar citire prin RLS.
// Când Sergiu exportă getMaterialPages() din features/materials, se înlocuiește aici.

/** Notițele și paginile PDF procesate ale unei materii, în ordine. */
export async function loadSubjectMaterial(subjectId: string): Promise<MaterialPage[]> {
  const supabase = await createClient();
  const [{ data: notes }, { data: materials }] = await Promise.all([
    supabase.from("notes").select("title, content").eq("subject_id", subjectId).order("updated_at", { ascending: false }).limit(20),
    supabase.from("materials").select("id, title, status").eq("subject_id", subjectId),
  ]);
  const ready = (materials ?? []).filter((m) => m.status === "procesat");
  const { data: pages } = ready.length
    ? await supabase
        .from("material_pages")
        .select("material_id, page_number, content")
        .in(
          "material_id",
          ready.map((m) => m.id),
        )
        .order("material_id")
        .order("page_number")
    : { data: [] };

  const titleOf = new Map(ready.map((m) => [m.id as string, m.title as string]));
  return [
    ...(notes ?? []).map((n) => ({ materialId: NOTES_SOURCE, title: `Notiță: ${n.title}`, page: 1, text: n.content as string })),
    ...(pages ?? []).map((p) => ({
      materialId: p.material_id as string,
      title: titleOf.get(p.material_id as string) ?? "Material",
      page: p.page_number as number,
      text: p.content as string,
    })),
  ].filter((p) => p.text.trim().length > 0);
}
