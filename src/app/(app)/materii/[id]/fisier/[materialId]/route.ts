import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_IMAGE_SIZES, previewImageSvg } from "@/features/materials/preview";
import { MaterialIdSchema } from "@/features/materials/schemas";
import { thumbPathFor } from "@/features/materials/types";
import { SubjectIdSchema } from "@/features/subjects/schemas";

// Deschide un material privat: verifică sesiunea și proprietarul (RLS), apoi redirecționează către un URL semnat
// creat acum. Linkurile din pagină nu expiră, dar URL-ul către Storage e valabil doar câteva minute.
// ?v=thumb → miniatura pozei (dacă lipsește, originalul).

/** PDF-urile mari se citesc progresiv în vizualizatorul browserului, deci le dăm puțin mai mult timp. */
const PDF_URL_SECONDS = 300;
const IMAGE_URL_SECONDS = 60;

export async function GET(request: NextRequest, ctx: RouteContext<"/materii/[id]/fisier/[materialId]">) {
  const { id, materialId } = await ctx.params;
  const notFound = () => new NextResponse("Materialul nu există.", { status: 404 });
  if (!SubjectIdSchema.safeParse(id).success || !MaterialIdSchema.safeParse(materialId).success) return notFound();

  if (isPreviewMode()) {
    if (!PREVIEW_IMAGE_SIZES[materialId]) return new NextResponse("Modul previzualizare nu are fișiere reale.", { status: 404 });
    return new NextResponse(previewImageSvg(materialId), {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=3600" },
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/autentificare", request.url));

  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("storage_path, mime_type")
    .eq("id", materialId)
    .eq("subject_id", id)
    .maybeSingle();
  if (!data) return notFound();

  const path = data.storage_path as string;
  const isImage = (data.mime_type as string).startsWith("image/");
  const bucket = supabase.storage.from("materials");
  const seconds = isImage ? IMAGE_URL_SECONDS : PDF_URL_SECONDS;

  let signed = isImage && request.nextUrl.searchParams.get("v") === "thumb"
    ? (await bucket.createSignedUrl(thumbPathFor(path), seconds)).data
    : null;
  signed ??= (await bucket.createSignedUrl(path, seconds)).data;
  if (!signed?.signedUrl) return notFound();

  const response = NextResponse.redirect(signed.signedUrl, 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
